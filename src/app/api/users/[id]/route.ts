import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[id]
 * Mengambil profil publik penjual beserta statistik dan produk aktifnya
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        campusName: true,
        faculty: true,
        avatarUrl: true,
        isVerifiedStudent: true,
        honestyScore: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            reviewsReceived: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Ambil produk aktif yang dijual
    const activeProducts = await prisma.product.findMany({
      where: {
        sellerId: id,
        status: 'ACTIVE',
      },
      include: {
        media: {
          take: 1,
        },
        codZone: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Hitung total barang terjual
    const soldCount = await prisma.product.count({
      where: {
        sellerId: id,
        status: 'SOLD',
      },
    })

    return NextResponse.json({
      data: {
        ...user,
        soldCount,
        activeProducts,
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil profil pengguna' },
      { status: 500 }
    )
  }
}
