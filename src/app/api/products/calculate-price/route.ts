import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDisplayPrice } from '@/lib/utils'

/**
 * POST /api/products/calculate-price
 * Menghitung rincian harga untuk penjual secara transparan
 * Request body: { basePrice: number }
 * Response: { basePrice, markupAmount, displayPrice, markupPercentage, fixedFee }
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

    // Ambil SystemConfig markup
    const systemConfig = await prisma.systemConfig.findFirst()
    const markupPercentage = systemConfig?.markupPercentage ?? 5.0
    const fixedFee = systemConfig?.fixedFee ?? 1000

    const displayPrice = calculateDisplayPrice(basePrice, markupPercentage, fixedFee)
    const markupAmount = displayPrice - basePrice

    return NextResponse.json({
      data: {
        basePrice,
        markupAmount,
        displayPrice,
        markupPercentage,
        fixedFee,
      },
    })
  } catch (error) {
    console.error('Error calculating price:', error)
    return NextResponse.json(
      { error: 'Gagal menghitung markup harga' },
      { status: 500 }
    )
  }
}
