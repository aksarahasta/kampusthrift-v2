import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProductSchema, productFilterSchema, productMediaSchema } from '@/lib/validations/product'
import { expireStaleReservations } from '@/lib/transactions'
import { MediaType, Prisma, ProductStatus } from '@prisma/client'
import { z } from 'zod'

const zMediaArray = z.array(productMediaSchema).min(2).max(20)
const zUrl = z.string().url()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await expireStaleReservations()
    const { searchParams } = new URL(request.url)
    const filtersResult = productFilterSchema.safeParse({
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      conditionMin: searchParams.get('conditionMin') ? Number(searchParams.get('conditionMin')) : undefined,
      conditionMax: searchParams.get('conditionMax') ? Number(searchParams.get('conditionMax')) : undefined,
      isBarter: searchParams.get('isBarter') === 'true' ? true : searchParams.get('isBarter') === 'false' ? false : undefined,
      verifiedStudentOnly: searchParams.get('verifiedStudentOnly') === 'true',
      campusName: searchParams.get('campusName') || undefined,
      codZoneId: searchParams.get('codZoneId') || undefined,
      // radiusKm is intentionally ignored: Safe Zones are discrete admin-managed locations.
    })
    if (!filtersResult.success) {
      return NextResponse.json({ error: 'Filter produk tidak valid' }, { status: 400 })
    }
    const filters = filtersResult.data
    const search = searchParams.get('search')?.trim() || undefined
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter halaman tidak valid' }, { status: 400 })
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice !== undefined && { displayPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice !== undefined && { displayPrice: { lte: filters.maxPrice } }),
      ...(filters.conditionMin !== undefined && { conditionPercentage: { gte: filters.conditionMin } }),
      ...(filters.conditionMax !== undefined && { conditionPercentage: { lte: filters.conditionMax } }),
      ...(filters.isBarter !== undefined && { isBarter: filters.isBarter }),
      ...(filters.campusName && { campusName: { contains: filters.campusName, mode: 'insensitive' } }),
      ...(filters.codZoneId && { codZoneId: filters.codZoneId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.verifiedStudentOnly && { seller: { isVerifiedStudent: true } }),
    }

    const skip = (page - 1) * limit
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
          media: { orderBy: { isPrimary: 'desc' }, take: 3 },
          codZone: { select: { campusName: true, locationName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Anda harus login untuk membuat listing' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Data listing tidak valid' }, { status: 400 })
    }

    const dataResult = createProductSchema.safeParse(body)
    if (!dataResult.success) {
      return NextResponse.json({ error: dataResult.error.issues[0]?.message || 'Data listing tidak valid' }, { status: 400 })
    }
    const validatedData = dataResult.data

    const mediaResult = zMediaArray.safeParse(body.media)
    if (!mediaResult.success) {
      return NextResponse.json({ error: 'Media listing tidak valid' }, { status: 400 })
    }
    const media = mediaResult.data
    if (!media.some((item) => item.mediaType === MediaType.IMAGE) || !media.some((item) => item.mediaType === MediaType.VIDEO)) {
      return NextResponse.json({ error: 'Wajib mengunggah minimal 1 foto dan 1 video produk' }, { status: 400 })
    }

    if (validatedData.isBarter && !session.user.isVerifiedStudent) {
      return NextResponse.json({ error: 'Hanya mahasiswa terverifikasi yang dapat menggunakan fitur barter' }, { status: 403 })
    }

    const codZone = await prisma.codZone.findFirst({
      where: {
        id: validatedData.codZoneId,
        isActive: true,
        campusName: validatedData.campusName,
      },
      select: { id: true },
    })
    if (!codZone) {
      return NextResponse.json({ error: 'Titik COD aktif tidak ditemukan untuk kampus tersebut' }, { status: 400 })
    }

    const paymentProofUrl = typeof body.paymentProofUrl === 'string' ? body.paymentProofUrl : undefined
    if (paymentProofUrl && !zUrl.safeParse(paymentProofUrl).success) {
      return NextResponse.json({ error: 'URL bukti pembayaran tidak valid' }, { status: 400 })
    }

    const systemConfig = await prisma.systemConfig.findFirst()
    const listingFee = systemConfig?.listingFee ?? 2000
    const product = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        basePrice: validatedData.basePrice,
        displayPrice: validatedData.basePrice,
        listingFeePaid: listingFee,
        paymentProofUrl: paymentProofUrl || null,
        isBarter: validatedData.isBarter,
        barterTarget: validatedData.barterTarget || null,
        conditionPercentage: validatedData.conditionPercentage,
        campusName: validatedData.campusName,
        codZoneId: codZone.id,
        status: ProductStatus.PENDING_PAYMENT,
        media: {
          create: media.map((item) => ({
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            isPrimary: item.isPrimary,
          })),
        },
      },
      include: { media: true, codZone: true },
    })

    return NextResponse.json({
      message: 'Listing berhasil dikirim! Menunggu validasi pembayaran dari admin.',
      data: product,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Produk dengan data serupa sudah ada' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Gagal membuat listing produk' }, { status: 500 })
  }
}
