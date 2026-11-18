import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { MarketplaceTransactionStatus, Prisma, ProductStatus } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReviewSchema } from '@/lib/validations/product'
import { calculateAverageScore } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk memberikan ulasan' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const parsed = createReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data ulasan tidak valid' }, { status: 400 })
    }
    const input = parsed.data

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, sellerId: true, status: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    if (product.status !== ProductStatus.SOLD) {
      return NextResponse.json({ error: 'Hanya produk yang telah selesai terjual yang dapat diulas' }, { status: 409 })
    }

    const completedTransaction = await prisma.marketplaceTransaction.findFirst({
      where: {
        productId: product.id,
        buyerId: session.user.id,
        sellerId: product.sellerId,
        status: MarketplaceTransactionStatus.COMPLETED,
      },
      select: { id: true },
    })
    if (!completedTransaction) {
      return NextResponse.json({ error: 'Ulasan hanya dapat diberikan oleh pembeli pada transaksi selesai' }, { status: 403 })
    }

    const review = await prisma.$transaction(async (db) => {
      const created = await db.review.create({
        data: {
          productId: product.id,
          sellerId: product.sellerId,
          buyerId: session.user.id,
          score: input.score,
          comment: input.comment,
        },
        include: {
          seller: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } },
        },
      })
      const sellerReviews = await db.review.findMany({
        where: { sellerId: product.sellerId },
        select: { score: true },
      })
      await db.user.update({
        where: { id: product.sellerId },
        data: { honestyScore: calculateAverageScore(sellerReviews.map((item) => item.score)) },
      })
      return created
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    return NextResponse.json({ message: 'Ulasan berhasil dikirim', data: review }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Ulasan untuk produk ini sudah pernah diberikan' }, { status: 409 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Ulasan berubah bersamaan, silakan coba lagi' }, { status: 409 })
    }
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Gagal mengirim ulasan' }, { status: 500 })
  }
}
