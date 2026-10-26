import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULT_COD_ZONES = [
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Teknik (FT)', description: 'Area lobi dekanat FT / gazebo teknik' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Keolahragaan (FIK)', description: 'Area depan gedung dekanat FIK / lapangan' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Hukum (FH)', description: 'Lobi utama gedung dekanat FH' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)', description: 'Area taman / lobi gedung C FISIP' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Pendidikan dan Psikologi (FIPP)', description: 'Lobi gedung A FIPP' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)', description: 'Lobi dekanat FMIPA / gedung D' },
  { campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Bahasa dan Seni (FBS)', description: 'Area B7 / panggung terbuka FBS' },
]

/**
 * GET /api/cod-zones
 * Mengambil daftar COD Safe Zone kampus yang aktif (Hanya UNNES)
 */
export async function GET(request: NextRequest) {
  try {
    // Cari zona UNNES yang aktif
    let codZones = await prisma.codZone.findMany({
      where: {
        isActive: true,
        campusName: { contains: 'UNNES', mode: 'insensitive' as const },
      },
      orderBy: { locationName: 'asc' },
    })

    // Jika belum ada zona UNNES sama sekali di database, langsung buat ke-7 fakultas
    if (codZones.length === 0) {
      try {
        await prisma.codZone.createMany({
          data: DEFAULT_COD_ZONES.map((zone) => ({
            ...zone,
            isActive: true,
          })),
          skipDuplicates: true,
        })

        // Nonaktifkan zona selain UNNES yang ada di DB lama
        await prisma.codZone.updateMany({
          where: {
            NOT: {
              campusName: { contains: 'UNNES', mode: 'insensitive' as const },
            },
          },
          data: { isActive: false },
        })

        codZones = await prisma.codZone.findMany({
          where: {
            isActive: true,
            campusName: { contains: 'UNNES', mode: 'insensitive' as const },
          },
          orderBy: { locationName: 'asc' },
        })
      } catch (seedErr) {
        console.error('Error bootstrapping UNNES zones:', seedErr)
      }
    }

    // Jika database gagal/offline, kirim data default langsung
    if (codZones.length === 0) {
      return NextResponse.json({
        data: DEFAULT_COD_ZONES.map((z, idx) => ({
          id: `unnes-zone-${idx + 1}`,
          ...z,
        })),
      })
    }

    return NextResponse.json({ data: codZones })
  } catch (error) {
    console.error('Error fetching COD zones:', error)
    // Fallback response agar frontend tidak pernah kosong
    return NextResponse.json({
      data: DEFAULT_COD_ZONES.map((z, idx) => ({
        id: `unnes-zone-${idx + 1}`,
        ...z,
      })),
    })
  }
}
