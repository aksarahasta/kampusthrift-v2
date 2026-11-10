import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'

/**
 * PATCH /api/admin/products/[id]/validate
 * Admin memvalidasi bukti bayar listing fee.
 * body: { action: 'APPROVE' | 'REJECT', note?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reason } = body as {
      action: 'APPROVE' | 'REJECT'
      reason?: string
      note?: string
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Hanya izinkan validasi jika status PENDING_PAYMENT atau REJECTED (untuk pulihkan)
    if (product.status !== ProductStatus.PENDING_PAYMENT && product.status !== ProductStatus.REJECTED) {
      return NextResponse.json(
        { error: 'Produk tidak dalam status menunggu validasi pembayaran' },
        { status: 400 }
      )
    }

    const newStatus = action === 'APPROVE' ? ProductStatus.ACTIVE : ProductStatus.REJECTED

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        rejectionReason:
          action === 'REJECT'
            ? reason || 'Bukti transfer tidak valid atau nominal tidak sesuai.'
            : null,
      },
    })

    return NextResponse.json({
      message:
        action === 'APPROVE'
          ? 'Produk berhasil dipublikasikan!'
          : 'Produk ditolak dan dikembalikan ke penjual.',
      data: updated,
    })
  } catch (error) {
    console.error('Error validating payment:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
