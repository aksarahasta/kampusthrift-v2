import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cod-zones
 * Mengambil daftar COD Safe Zone kampus yang aktif
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campus = searchParams.get('campus')

    const codZones = await prisma.codZone.findMany({
      where: {
        isActive: true,
        ...(campus ? { campusName: { contains: campus, mode: 'insensitive' } } : {}),
      },
      orderBy: [
        { campusName: 'asc' },
        { locationName: 'asc' },
      ],
    })

    return NextResponse.json({ data: codZones })
  } catch (error) {
    console.error('Error fetching COD zones:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data COD Safe Zone' },
      { status: 500 }
    )
  }
}
