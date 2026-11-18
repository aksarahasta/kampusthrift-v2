import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { MarketplaceTransactionStatus, ProductStatus, Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireStaleReservations, MarketplaceTransactionError, runSerializable } from '@/lib/transactions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel', 'confirm']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk mengubah permintaan' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Aksi transaksi tidak valid' }, { status: 400 })
    }

    await expireStaleReservations()
    const updated = await runSerializable(async (db) => {
      const transaction = await db.marketplaceTransaction.findUnique({
        where: { id: params.id },
      })
      if (!transaction) {
        throw new MarketplaceTransactionError('Permintaan pembelian tidak ditemukan', 404)
      }
      const userId = session.user.id
      const isBuyer = transaction.buyerId === userId
      const isSeller = transaction.sellerId === userId
      if (!isBuyer && !isSeller) {
        throw new MarketplaceTransactionError('Anda tidak memiliki izin untuk permintaan ini', 403)
      }

      const now = new Date()
      if (
        transaction.status === MarketplaceTransactionStatus.RESERVED &&
        transaction.expiresAt &&
        transaction.expiresAt <= now
      ) {
        const expired = await db.marketplaceTransaction.updateMany({
          where: {
            id: transaction.id,
            status: MarketplaceTransactionStatus.RESERVED,
            expiresAt: { lte: now },
          },
          data: { status: MarketplaceTransactionStatus.EXPIRED, updatedAt: now },
        })
        if (expired.count === 1) {
          await db.product.updateMany({
            where: { id: transaction.productId, status: ProductStatus.RESERVED },
            data: { status: ProductStatus.ACTIVE, updatedAt: now },
          })
        }
        return {
          transaction: await db.marketplaceTransaction.findUniqueOrThrow({ where: { id: transaction.id } }),
          expired: true,
        }
      }

      switch (parsed.data.action) {
        case 'accept': {
          if (!isSeller) throw new MarketplaceTransactionError('Hanya penjual yang dapat menerima permintaan', 403)
          if (transaction.status !== MarketplaceTransactionStatus.PENDING_SELLER) {
            throw new MarketplaceTransactionError('Permintaan tidak lagi menunggu persetujuan', 409)
          }
          const reserved = await db.product.updateMany({
            where: { id: transaction.productId, status: ProductStatus.ACTIVE },
            data: { status: ProductStatus.RESERVED, updatedAt: now },
          })
          if (reserved.count !== 1) {
            throw new MarketplaceTransactionError('Produk tidak lagi tersedia', 409)
          }
          const accepted = await db.marketplaceTransaction.updateMany({
            where: { id: transaction.id, status: MarketplaceTransactionStatus.PENDING_SELLER },
            data: {
              status: MarketplaceTransactionStatus.RESERVED,
              expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
              updatedAt: now,
            },
          })
          if (accepted.count !== 1) {
            throw new MarketplaceTransactionError('Permintaan sudah diproses', 409)
          }
          await db.marketplaceTransaction.updateMany({
            where: {
              productId: transaction.productId,
              id: { not: transaction.id },
              status: MarketplaceTransactionStatus.PENDING_SELLER,
            },
            data: { status: MarketplaceTransactionStatus.DECLINED, updatedAt: now },
          })
          break
        }
        case 'decline': {
          if (!isSeller) throw new MarketplaceTransactionError('Hanya penjual yang dapat menolak permintaan', 403)
          const declined = await db.marketplaceTransaction.updateMany({
            where: { id: transaction.id, status: MarketplaceTransactionStatus.PENDING_SELLER },
            data: { status: MarketplaceTransactionStatus.DECLINED, updatedAt: now },
          })
          if (declined.count !== 1) {
            throw new MarketplaceTransactionError('Permintaan tidak lagi menunggu persetujuan', 409)
          }
          break
        }
        case 'cancel': {
          if (transaction.status !== MarketplaceTransactionStatus.PENDING_SELLER && transaction.status !== MarketplaceTransactionStatus.RESERVED) {
            throw new MarketplaceTransactionError('Transaksi yang sudah selesai tidak dapat dibatalkan', 409)
          }
          const cancelled = await db.marketplaceTransaction.updateMany({
            where: {
              id: transaction.id,
              status: transaction.status,
            },
            data: { status: MarketplaceTransactionStatus.CANCELLED, updatedAt: now },
          })
          if (cancelled.count !== 1) {
            throw new MarketplaceTransactionError('Transaksi sudah berubah, silakan muat ulang', 409)
          }
          if (transaction.status === MarketplaceTransactionStatus.RESERVED) {
            const released = await db.product.updateMany({
              where: { id: transaction.productId, status: ProductStatus.RESERVED },
              data: { status: ProductStatus.ACTIVE, updatedAt: now },
            })
            if (released.count !== 1) {
              throw new MarketplaceTransactionError('Reservasi produk sudah berubah', 409)
            }
          }
          break
        }
        case 'confirm': {
          if (transaction.status === MarketplaceTransactionStatus.COMPLETED) break
          if (transaction.status !== MarketplaceTransactionStatus.RESERVED) {
            throw new MarketplaceTransactionError('Hanya reservasi aktif yang dapat dikonfirmasi', 409)
          }
          const ownConfirmation = isBuyer ? transaction.buyerConfirmedAt : transaction.sellerConfirmedAt
          if (ownConfirmation) break

          const data = isBuyer ? { buyerConfirmedAt: now, updatedAt: now } : { sellerConfirmedAt: now, updatedAt: now }
          const confirmed = await db.marketplaceTransaction.updateMany({
            where: {
              id: transaction.id,
              status: MarketplaceTransactionStatus.RESERVED,
              ...(isBuyer ? { buyerConfirmedAt: null } : { sellerConfirmedAt: null }),
            },
            data,
          })
          if (confirmed.count !== 1) {
            throw new MarketplaceTransactionError('Konfirmasi sudah berubah, silakan muat ulang', 409)
          }

          const otherHasConfirmed = isBuyer ? transaction.sellerConfirmedAt !== null : transaction.buyerConfirmedAt !== null
          if (otherHasConfirmed) {
            const sold = await db.product.updateMany({
              where: { id: transaction.productId, status: ProductStatus.RESERVED },
              data: { status: ProductStatus.SOLD, updatedAt: now },
            })
            if (sold.count !== 1) {
              throw new MarketplaceTransactionError('Produk tidak lagi dalam reservasi ini', 409)
            }
            await db.marketplaceTransaction.update({
              where: { id: transaction.id },
              data: {
                status: MarketplaceTransactionStatus.COMPLETED,
                completedAt: now,
                updatedAt: now,
              },
            })
          }
          break
        }
      }

      return {
        transaction: await db.marketplaceTransaction.findUniqueOrThrow({ where: { id: transaction.id } }),
        expired: false,
      }
    })

    if (updated.expired) {
      return NextResponse.json({ error: 'Reservasi telah kedaluwarsa dan produk kembali tersedia' }, { status: 409 })
    }
    return NextResponse.json({ data: updated.transaction })
  } catch (error) {
    if (error instanceof MarketplaceTransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Transaksi berubah bersamaan, silakan muat ulang' }, { status: 409 })
    }
    console.error('Error updating marketplace transaction:', error)
    return NextResponse.json({ error: 'Gagal mengubah permintaan pembelian' }, { status: 500 })
  }
}
