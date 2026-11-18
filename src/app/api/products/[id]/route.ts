import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { productMediaSchema, updateProductSchema } from '@/lib/validations/product'
import { MarketplaceTransactionStatus, ProductStatus, Prisma, Role } from '@prisma/client'
import { expireStaleReservations, runSerializable } from '@/lib/transactions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/[id]
 * Mengambil detail produk berdasarkan ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    await expireStaleReservations()
    const product = await prisma.product.findUnique({
      where: { id, status: { not: ProductStatus.BANNED } },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            isVerifiedStudent: true,
            honestyScore: true,
            campusName: true,
            faculty: true,
          },
        },
        media: true,
        codZone: { select: { campusName: true, locationName: true, description: true } },
        review: {
          include: { buyer: { select: { id: true, name: true, campusName: true } } },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const session = await getServerSession(authOptions)
    const mayViewSellerContact = session?.user?.id
      ? await prisma.marketplaceTransaction.findFirst({
          where: {
            productId: id,
            buyerId: session.user.id,
            status: { in: [MarketplaceTransactionStatus.RESERVED, MarketplaceTransactionStatus.COMPLETED] },
          },
          select: { id: true },
        })
      : null
    const seller = mayViewSellerContact
      ? {
          ...product.seller,
          phoneWhatsapp: (await prisma.user.findUnique({
            where: { id: product.seller.id },
            select: { phoneWhatsapp: true },
          }))?.phoneWhatsapp,
        }
      : product.seller

    return NextResponse.json({ data: { ...product, seller } })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail produk' },
      { status: 500 }
    )
  }
}

/** Updates listing data without bypassing the transaction status flow. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk mengupdate produk' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Data produk tidak valid' }, { status: 400 })
    }
    const result = updateProductSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Data produk tidak valid' }, { status: 400 })
    }
    const validatedData = result.data
    const isAdmin = session.user.role === Role.ADMIN
    if (!isAdmin && validatedData.status !== undefined) {
      return NextResponse.json({ error: 'Status listing hanya dapat diubah melalui alur transaksi atau admin' }, { status: 403 })
    }

    let media: z.infer<typeof productMediaSchema>[] | undefined
    if (body.media !== undefined) {
      const mediaResult = z.array(productMediaSchema).min(1).max(20).safeParse(body.media)
      if (!mediaResult.success) {
        return NextResponse.json({ error: 'Media produk tidak valid' }, { status: 400 })
      }
      media = mediaResult.data
    }
    if (body.paymentProofUrl !== undefined && (typeof body.paymentProofUrl !== 'string' || !z.string().url().safeParse(body.paymentProofUrl).success)) {
      return NextResponse.json({ error: 'URL bukti pembayaran tidak valid' }, { status: 400 })
    }

    const updatedProduct = await runSerializable(async (db) => {
      const product = await db.product.findUnique({ where: { id: params.id } })
      if (!product) throw new ProductPatchError('Produk tidak ditemukan', 404)

      const isSeller = product.sellerId === session.user.id
      if (!isSeller && !isAdmin) {
        throw new ProductPatchError('Anda tidak memiliki izin untuk mengupdate produk ini', 403)
      }
      if (isSeller && (product.status === ProductStatus.RESERVED || product.status === ProductStatus.SOLD)) {
        throw new ProductPatchError('Produk yang sedang direservasi atau sudah terjual tidak dapat diedit', 409)
      }

      const now = new Date()
      if (isAdmin && validatedData.status === ProductStatus.BANNED) {
        if (product.status === ProductStatus.RESERVED) {
          throw new ProductPatchError('Produk yang sedang direservasi tidak dapat dibanned sampai transaksi selesai atau dibatalkan', 409)
        }
        return db.product.update({
          where: { id: product.id },
          data: { status: ProductStatus.BANNED, updatedAt: now },
          include: { media: true, codZone: true },
        })
      }

      const paymentProofUrl = typeof body.paymentProofUrl === 'string' ? body.paymentProofUrl : undefined
      if (paymentProofUrl && isSeller && product.status !== ProductStatus.REJECTED) {
        throw new ProductPatchError('Bukti pembayaran baru hanya dapat dikirim untuk listing yang ditolak', 409)
      }

      const campusName = validatedData.campusName ?? product.campusName
      const codZoneId = validatedData.codZoneId ?? product.codZoneId
      if (validatedData.campusName !== undefined || validatedData.codZoneId !== undefined) {
        const zone = await db.codZone.findFirst({
          where: { id: codZoneId, campusName, isActive: true },
          select: { id: true },
        })
        if (!zone) throw new ProductPatchError('Titik COD aktif tidak ditemukan untuk kampus tersebut', 400)
      }

      const updateData: Prisma.ProductUncheckedUpdateInput = {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.basePrice !== undefined && {
          basePrice: validatedData.basePrice,
          displayPrice: validatedData.basePrice,
        }),
        ...(validatedData.isBarter !== undefined && { isBarter: validatedData.isBarter }),
        ...(validatedData.barterTarget !== undefined && { barterTarget: validatedData.barterTarget || null }),
        ...(validatedData.conditionPercentage !== undefined && { conditionPercentage: validatedData.conditionPercentage }),
        ...(validatedData.campusName !== undefined && { campusName: validatedData.campusName }),
        ...(validatedData.codZoneId !== undefined && { codZoneId: validatedData.codZoneId }),
        ...(isAdmin && validatedData.status !== undefined && { status: validatedData.status }),
        ...(paymentProofUrl && { paymentProofUrl, status: ProductStatus.PENDING_PAYMENT, rejectionReason: null }),
        updatedAt: now,
      }

      if (media) {
        await db.productMedia.deleteMany({ where: { productId: product.id } })
        await db.productMedia.createMany({
          data: media.map((item) => ({
            productId: product.id,
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            isPrimary: item.isPrimary,
          })),
        })
      }

      return db.product.update({
        where: { id: product.id },
        data: updateData,
        include: { media: true, codZone: true },
      })
    })

    return NextResponse.json({
      message: validatedData.status === ProductStatus.BANNED && isAdmin ? 'Produk berhasil dibanned' : 'Produk berhasil diperbarui',
      data: updatedProduct,
    })
  } catch (error) {
    if (error instanceof ProductPatchError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Produk berubah bersamaan, silakan muat ulang' }, { status: 409 })
    }
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Gagal mengupdate produk' }, { status: 500 })
  }
}

class ProductPatchError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
  }
}

/**
 * DELETE /api/products/[id]
 * Menghapus produk (soft delete dengan status BANNED atau hard delete untuk seller sendiri)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anda harus login untuk menghapus produk' },
        { status: 401 }
      )
    }

    // Cek apakah produk ada
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validasi akses: Seller atau Admin
    const isSeller = product.sellerId === session.user.id
    const isAdmin = session.user.role === Role.ADMIN

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus produk ini' },
        { status: 403 }
      )
    }

    if (product.status === ProductStatus.RESERVED || (isSeller && product.status === ProductStatus.SOLD)) {
      return NextResponse.json(
        { error: product.status === ProductStatus.RESERVED
          ? 'Produk yang sedang direservasi tidak dapat dihapus sampai transaksi selesai atau dibatalkan'
          : 'Produk yang sudah terjual tidak dapat dihapus' },
        { status: 409 }
      )
    }

    // Keep transaction history and foreign-key references intact for both roles.
    const removed = await prisma.product.updateMany({
      where: {
        id,
        ...(isSeller && { sellerId: session.user.id }),
        status: { not: ProductStatus.RESERVED },
      },
      data: { status: ProductStatus.BANNED },
    })
    if (removed.count !== 1) {
      return NextResponse.json(
        { error: 'Produk berubah atau sedang bertransaksi, silakan muat ulang' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      message: 'Produk berhasil dihapus dari katalog',
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Produk dengan riwayat transaksi tidak dapat dihapus permanen' },
        { status: 409 }
      )
    }
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}
