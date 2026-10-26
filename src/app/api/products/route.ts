import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProductSchema, productFilterSchema } from '@/lib/validations/product'
import { calculateDisplayPrice } from '@/lib/utils'
import { ProductStatus, MediaType, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products
 * Mengambil daftar produk dengan filter kategori, barter, student, radius
 * Query: category, minPrice, maxPrice, conditionMin, conditionMax, isBarter, verifiedStudentOnly, campusName, radiusKm, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = productFilterSchema.parse({
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      conditionMin: searchParams.get('conditionMin') ? parseInt(searchParams.get('conditionMin')!) : undefined,
      conditionMax: searchParams.get('conditionMax') ? parseInt(searchParams.get('conditionMax')!) : undefined,
      isBarter: searchParams.get('isBarter') === 'true' ? true : searchParams.get('isBarter') === 'false' ? false : undefined,
      verifiedStudentOnly: searchParams.get('verifiedStudentOnly') === 'true',
      campusName: searchParams.get('campusName') || undefined,
      radiusKm: searchParams.get('radiusKm') ? parseInt(searchParams.get('radiusKm')!) : undefined,
    })

    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice !== undefined && { displayPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice !== undefined && { displayPrice: { lte: filters.maxPrice } }),
      ...(filters.conditionMin !== undefined && { conditionPercentage: { gte: filters.conditionMin } }),
      ...(filters.conditionMax !== undefined && { conditionPercentage: { lte: filters.conditionMax } }),
      ...(filters.isBarter !== undefined && { isBarter: filters.isBarter }),
      ...(filters.campusName && { campusName: { contains: filters.campusName, mode: 'insensitive' as const } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      // Filter by verified student only
      ...(filters.verifiedStudentOnly && {
        seller: { isVerifiedStudent: true },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
            orderBy: { isPrimary: 'desc' },
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
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data produk' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Membuat listing produk baru dengan validasi wajib 1 foto + 1 video
 * Kalkulasi displayPrice berdasarkan SystemConfig markup
 * Hanya Verified Student yang bisa mengaktifkan isBarter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anda harus login untuk membuat listing' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input (tanpa media, karena media di-handle terpisah)
    const validatedData = createProductSchema.parse(body)

    // Validasi media wajib: minimal 1 foto dan 1 video
    const media = body.media as Array<{ mediaUrl: string; mediaType: MediaType; isPrimary?: boolean }> | undefined

    if (!media || media.length === 0) {
      return NextResponse.json(
        { error: 'Wajib mengunggah minimal 1 foto dan 1 video produk' },
        { status: 400 }
      )
    }

    const hasImage = media.some((m) => m.mediaType === 'IMAGE')
    const hasVideo = media.some((m) => m.mediaType === 'VIDEO')

    if (!hasImage || !hasVideo) {
      return NextResponse.json(
        { error: 'Wajib mengunggah minimal 1 foto dan 1 video produk' },
        { status: 400 }
      )
    }

    // Validasi barter: hanya untuk verified student
    if (validatedData.isBarter && !session.user.isVerifiedStudent) {
      return NextResponse.json(
        { error: 'Hanya mahasiswa terverifikasi yang dapat menggunakan fitur barter' },
        { status: 403 }
      )
    }

    // Validasi COD Zone (dengan auto-fallback jika ID custom atau tabel belum ada)
    let validCodZoneId = validatedData.codZoneId

    const codZone = await prisma.codZone.findUnique({
      where: { id: validatedData.codZoneId },
    })

    if (!codZone) {
      // Cari zona UNNES yang ada di database
      let unnesZone = await prisma.codZone.findFirst({
        where: {
          campusName: { contains: 'UNNES', mode: 'insensitive' as const },
          isActive: true,
        },
      })

      // Jika belum ada zona UNNES di DB sama sekali, buatkan satu otomatis
      if (!unnesZone) {
        unnesZone = await prisma.codZone.create({
          data: {
            campusName: 'Universitas Negeri Semarang (UNNES)',
            locationName: 'Fakultas Teknik (FT)',
            description: 'Area lobi dekanat FT / gazebo teknik',
            isActive: true,
          },
        })
      }

      validCodZoneId = unnesZone.id
    }

    // Ambil konfigurasi markup dari SystemConfig
    const systemConfig = await prisma.systemConfig.findFirst()
    const markupPercentage = systemConfig?.markupPercentage ?? 5.0
    const fixedFee = systemConfig?.fixedFee ?? 1000

    // Kalkulasi displayPrice
    const displayPrice = calculateDisplayPrice(
      validatedData.basePrice,
      markupPercentage,
      fixedFee
    )

    // Buat produk
    const product = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        basePrice: validatedData.basePrice,
        displayPrice,
        isBarter: validatedData.isBarter,
        barterTarget: validatedData.barterTarget || null,
        conditionPercentage: validatedData.conditionPercentage,
        campusName: validatedData.campusName,
        codZoneId: validCodZoneId,
        status: ProductStatus.ACTIVE,
        media: {
          create: media.map((m) => ({
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            isPrimary: m.isPrimary ?? false,
          })),
        },
      },
      include: {
        media: true,
        codZone: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Listing berhasil dibuat',
        data: product,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Produk dengan data serupa sudah ada' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Gagal membuat listing produk' },
      { status: 500 }
    )
  }
}
