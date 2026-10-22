import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { systemConfigSchema } from '@/lib/validations/admin'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/config
 * Mengambil konfigurasi sistem saat ini
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const config = await prisma.systemConfig.findFirst()

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Error fetching system config:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/config
 * Mengupdate konfigurasi markup harga
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = systemConfigSchema.parse(body)

    // Update or create system config
    const existingConfig = await prisma.systemConfig.findFirst()

    let config
    if (existingConfig) {
      config = await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          markupPercentage: validatedData.markupPercentage,
          fixedFee: validatedData.fixedFee,
        },
      })
    } else {
      config = await prisma.systemConfig.create({
        data: {
          markupPercentage: validatedData.markupPercentage,
          fixedFee: validatedData.fixedFee,
        },
      })
    }

    return NextResponse.json({
      message: 'Konfigurasi berhasil diperbarui',
      data: config,
    })
  } catch (error) {
    console.error('Error updating system config:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui konfigurasi' },
      { status: 500 }
    )
  }
}
