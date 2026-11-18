import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { MarketplaceTransactionStatus, ProductStatus, Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireStaleReservations, runSerializable } from '@/lib/transactions'

export const dynamic = 'force-dynamic'

const transactionSelect = {
  id: true,
  productId: true,
  buyerId: true,
  sellerId: true,
  codZoneId: true,
  status: true,
  expiresAt: true,
  buyerConfirmedAt: true,
  sellerConfirmedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  buyer: { select: { id: true, name: true, campusName: true, phoneWhatsapp: true } },
  seller: { select: { id: true, name: true, campusName: true, phoneWhatsapp: true } },
  codZone: { select: { campusName: true, locationName: true } },
} satisfies Prisma.MarketplaceTransactionSelect

function hideUnapprovedContacts<T extends {
  status: MarketplaceTransactionStatus
  buyer: { phoneWhatsapp: string }
  seller: { phoneWhatsapp: string }
}>(transaction: T) {
  const mayShareContact = transaction.status === MarketplaceTransactionStatus.RESERVED ||
    transaction.status === MarketplaceTransactionStatus.COMPLETED
  return {
    ...transaction,
    buyer: { ...transaction.buyer, ...(!mayShareContact && { phoneWhatsapp: undefined }) },
    seller: { ...transaction.seller, ...(!mayShareContact && { phoneWhatsapp: undefined }) },
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk melihat permintaan pembelian' }, { status: 401 })
    }

    await expireStaleReservations()
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const isSeller = product.sellerId === session.user.id
    const [mine, requests] = await Promise.all([
      prisma.marketplaceTransaction.findFirst({
        where: isSeller
          ? { productId: product.id, sellerId: session.user.id }
          : { productId: product.id, buyerId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: transactionSelect,
      }),
      isSeller
        ? prisma.marketplaceTransaction.findMany({
            where: { productId: product.id },
            orderBy: { createdAt: 'desc' },
            select: transactionSelect,
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      data: {
        mine: mine ? hideUnapprovedContacts(mine) : null,
        requests: requests.map(hideUnapprovedContacts),
      },
    })
  } catch (error) {
    console.error('Error fetching marketplace transactions:', error)
    return NextResponse.json({ error: 'Gagal mengambil permintaan pembelian' }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk meminta pembelian' }, { status: 401 })
    }

    await expireStaleReservations()
    const result = await runSerializable(async (db) => {
      const product = await db.product.findUnique({
        where: { id: params.id },
        include: { codZone: { select: { isActive: true } } },
      })
      if (!product || product.status === ProductStatus.BANNED) {
        throw new RequestError('Produk tidak ditemukan', 404)
      }
      if (product.sellerId === session.user.id) {
        throw new RequestError('Anda tidak dapat membeli produk sendiri', 403)
      }
      if (product.status !== ProductStatus.ACTIVE || !product.codZone.isActive) {
        throw new RequestError('Produk tidak tersedia untuk diminta', 409)
      }

      const existing = await db.marketplaceTransaction.findFirst({
        where: {
          productId: product.id,
          buyerId: session.user.id,
          status: { in: [MarketplaceTransactionStatus.PENDING_SELLER, MarketplaceTransactionStatus.RESERVED] },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) return { transaction: existing, created: false }

      const created = await db.marketplaceTransaction.create({
        data: {
          productId: product.id,
          buyerId: session.user.id,
          sellerId: product.sellerId,
          codZoneId: product.codZoneId,
          status: MarketplaceTransactionStatus.PENDING_SELLER,
        },
      })
      return { transaction: created, created: true }
    })

    return NextResponse.json({ data: result.transaction }, { status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof RequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Produk baru saja diminta pembeli lain, silakan muat ulang' }, { status: 409 })
    }
    console.error('Error creating marketplace transaction:', error)
    return NextResponse.json({ error: 'Gagal membuat permintaan pembelian' }, { status: 500 })
  }
}

class RequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
  }
}
