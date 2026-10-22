import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReviewSchema } from '@/lib/validations/product'
import { calculateAverageScore } from '@/lib/utils'
import { ProductStatus } from '@prisma/client'

/**
 * POST /api/reviews
 * Memberikan rating (1-5 bintang) dan ulasan untuk penjual setelah transaksi selesai.
 * Hanya buyer yang membeli produk tersebut dan produk sudah SOLD yang dapat memberikan review.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anda harus login untuk memberikan ulasan' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Cek apakah produk valid dan sudah terjual
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: { seller: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    if (product.status !== ProductStatus.SOLD) {
      return NextResponse.json(
        { error: 'Hanya dapat memberikan ulasan untuk produk yang sudah terjual' },
        { status: 400 }
      )
    }

    // Cek apakah sudah ada review untuk produk ini
    const existingReview = await prisma.review.findUnique({
      where: { productId: validatedData.productId },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan ulasan untuk produk ini' },
        { status: 400 }
      )
    }

    // Cek apakah user adalah buyer yang sah (contoh: sudah ada mekanisme tracking buyer)
    // Catatan: Implementasi nyata perlu sistem tracking buyer (misal: transaksi dengan buyerId)
    // Untuk MVP, kita asumsikan buyer adalah user yang sedang login

    const buyerId = session.user.id

    // Buat review
    const review = await prisma.review.create({
      data: {
        productId: validatedData.productId,
        sellerId: product.sellerId,
        buyerId,
        score: validatedData.score,
        comment: validatedData.comment,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Ambil semua review penjual untuk kalkulasi ulang honestyScore
    const allReviews = await prisma.review.findMany({
      where: { sellerId: product.sellerId },
    })

    const scores = allReviews.map((r) => r.score)
    const newHonestyScore = calculateAverageScore(scores)

    // Update honestyScore penjual
    await prisma.user.update({
      where: { id: product.sellerId },
      data: { honestyScore: newHonestyScore },
    })

    return NextResponse.json(
      {
        message: 'Ulasan berhasil dikirim',
        data: review,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review:', error)

    return NextResponse.json(
      { error: 'Gagal mengirim ulasan' },
      { status: 500 }
    )
  }
}
