import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

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

    // Ambil produk aktif yang dijual dengan menyertakan seller agar ProductCard tidak crash
    const activeProducts = await prisma.product.findMany({
      where: {
        sellerId: id,
        status: 'ACTIVE',
      },
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
