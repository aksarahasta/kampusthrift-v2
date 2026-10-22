import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCodZoneSchema, updateCodZoneSchema } from '@/lib/validations/product'
import { Role } from '@prisma/client'

/**
 * GET /api/admin/cod-zones
 * Mengambil semua COD zones (termasuk yang tidak aktif)
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

    const codZones = await prisma.codZone.findMany({
      orderBy: [
        { campusName: 'asc' },
        { locationName: 'asc' },
      ],
    })

    return NextResponse.json({ data: codZones })
  } catch (error) {
    console.error('Error fetching COD zones:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data COD zones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cod-zones
 * Membuat COD zone baru
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCodZoneSchema.parse(body)

    const codZone = await prisma.codZone.create({
      data: validatedData,
    })

    return NextResponse.json({
      message: 'COD Safe Zone berhasil dibuat',
      data: codZone,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating COD zone:', error)
    return NextResponse.json(
      { error: 'Gagal membuat COD zone' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cod-zones
 * Update COD zone
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
    const { id, ...data } = body
    const validatedData = updateCodZoneSchema.parse(data)

    const codZone = await prisma.codZone.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({
      message: 'COD Safe Zone berhasil diperbarui',
      data: codZone,
    })
  } catch (error) {
    console.error('Error updating COD zone:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui COD zone' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/cod-zones
 * Hapus COD zone
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID COD Zone diperlukan' },
        { status: 400 }
      )
    }

    // Check if COD zone is being used by any products
    const productsUsingZone = await prisma.product.count({
      where: { codZoneId: id },
    })

    if (productsUsingZone > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus. ${productsUsingZone} produk menggunakan COD zone ini.` },
        { status: 400 }
      )
    }

    await prisma.codZone.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'COD Safe Zone berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting COD zone:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus COD zone' },
      { status: 500 }
    )
  }
}
