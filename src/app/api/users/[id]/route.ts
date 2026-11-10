import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[id]
 * Mengambil profil publik penjual beserta statistik dan produk aktifnya
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneWhatsapp: true,
        campusName: true,
        faculty: true,
        avatarUrl: true,
        isVerifiedStudent: true,
        honestyScore: true,
        role: true,
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

    const session = await getServerSession(authOptions)
    const isOwner = session?.user?.id === id || session?.user?.role === Role.ADMIN

    // Jika pemilik/admin: tampilkan semua status (termasuk yang sedang direview & ditolak)
    // Jika pengunjung lain: hanya tampilkan produk yang aktif dijual
    const productWhere: any = {
      sellerId: id,
      ...(isOwner
        ? {
            status: {
              in: [
                ProductStatus.ACTIVE,
                ProductStatus.PENDING_PAYMENT,
                ProductStatus.REJECTED,
                ProductStatus.SOLD,
                ProductStatus.RESERVED,
              ],
            },
          }
        : {
            status: ProductStatus.ACTIVE,
          }),
    }

    const allSellerProducts = await prisma.product.findMany({
      where: productWhere,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            isVerifiedStudent: true,
            honestyScore: true,
            campusName: true,
          },
        },
        media: {
          take: 3,
        },
        codZone: {
          select: {
            campusName: true,
            locationName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Hitung total barang terjual
    const soldCount = await prisma.product.count({
      where: {
        sellerId: id,
        status: ProductStatus.SOLD,
      },
    })

    const activeList = allSellerProducts.filter((p) => p.status === ProductStatus.ACTIVE)
    const pendingList = allSellerProducts.filter((p) => p.status === ProductStatus.PENDING_PAYMENT)
    const rejectedList = allSellerProducts.filter((p) => p.status === ProductStatus.REJECTED)

    return NextResponse.json({
      data: {
        ...user,
        soldCount,
        activeProducts: activeList,
        allProducts: allSellerProducts,
        productCounts: {
          total: allSellerProducts.length,
          active: activeList.length,
          pending: pendingList.length,
          rejected: rejectedList.length,
          sold: soldCount,
        },
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

/**
 * PATCH /api/users/[id]
 * Mengupdate profil pengguna (Nama, No WhatsApp, Kampus, Fakultas, Avatar)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anda harus masuk untuk mengupdate profil' },
        { status: 401 }
      )
    }

    // Validasi izin: pemilik akun atau Admin
    const isOwner = session.user.id === id
    const isAdmin = session.user.role === Role.ADMIN

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengupdate profil ini' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, phoneWhatsapp, campusName, faculty, avatarUrl } = body

    const updateData: any = {}
    if (typeof name === 'string' && name.trim().length >= 2) {
      updateData.name = name.trim()
    }
    if (typeof phoneWhatsapp === 'string' && phoneWhatsapp.trim().length >= 8) {
      updateData.phoneWhatsapp = phoneWhatsapp.trim()
    }
    if (campusName !== undefined) {
      updateData.campusName = campusName ? String(campusName).trim() : null
    }
    if (faculty !== undefined) {
      updateData.faculty = faculty ? String(faculty).trim() : null
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneWhatsapp: true,
        campusName: true,
        faculty: true,
        avatarUrl: true,
        isVerifiedStudent: true,
        honestyScore: true,
        role: true,
      },
    })

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui profil pengguna' },
      { status: 500 }
    )
  }
}
