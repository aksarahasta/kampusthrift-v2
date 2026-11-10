import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/calculate-price
 * Mengambil informasi tarif listing fee platform untuk penjual
 */
export async function GET() {
  try {
    const systemConfig = await prisma.systemConfig.findFirst()
    const listingFee = systemConfig?.listingFee ?? 2000

    return NextResponse.json({
      data: {
        listingFee,
      },
    })
  } catch (error) {
    console.error('Error fetching listing fee:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil tarif listing' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/calculate-price
 * Model baru Pay-per-Listing:
 * Harga jual produk P_display = P_base (tanpa markup tersembunyi ke pembeli)
 * Penjual membayar listing fee di awal sebelum produk tayang
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const basePrice = parseInt(body.basePrice)

    if (isNaN(basePrice) || basePrice <= 0) {
      return NextResponse.json(
        { error: 'Harga dasar harus berupa angka positif' },
        { status: 400 }
      )
    }

    // Ambil SystemConfig listingFee
    const systemConfig = await prisma.systemConfig.findFirst()
    const listingFee = systemConfig?.listingFee ?? 2000

    // Model baru: displayPrice sama dengan basePrice
    const displayPrice = basePrice
    const markupAmount = 0

    return NextResponse.json({
      data: {
        basePrice,
        markupAmount,
        displayPrice,
        listingFee,
        markupPercentage: 0,
        fixedFee: 0,
      },
    })
  } catch (error) {
    console.error('Error calculating price:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil rincian biaya' },
      { status: 500 }
    )
  }
}
