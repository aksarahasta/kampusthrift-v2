import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[id]/reviews
 * Mengambil semua review yang diterima oleh penjual
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const reviews = await prisma.review.findMany({
      where: { sellerId: id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            campusName: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            displayPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: reviews })
  } catch (error) {
    console.error('Error fetching user reviews:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil ulasan pengguna' },
      { status: 500 }
    )
  }
}
