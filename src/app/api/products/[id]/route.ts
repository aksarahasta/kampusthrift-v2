import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProductSchema } from '@/lib/validations/product'
import { ProductStatus, Role } from '@prisma/client'

/**
 * GET /api/products/[id]
 * Mengambil detail produk berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id, status: { not: ProductStatus.BANNED } },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            isVerifiedStudent: true,
            honestyScore: true,
            campusName: true,
            faculty: true,
          },
        },
        media: true,
        codZone: {
          select: {
            campusName: true,
            locationName: true,
            description: true,
          },
        },
        review: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                campusName: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail produk' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[id]
 * Mengupdate produk (status ACTIVE/RESERVED/SOLD, edit data)
 * Hanya penjual yang memiliki produk atau Admin yang dapat mengedit
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
        { error: 'Anda harus login untuk mengupdate produk' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Cek apakah produk ada dan user memiliki akses
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validasi akses: Seller atau Admin
    const isSeller = product.sellerId === session.user.id
    const isAdmin = session.user.role === Role.ADMIN

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengupdate produk ini' },
        { status: 403 }
      )
    }

    // Jika admin melakukan banned, langsung update tanpa cek lagi
    if (validatedData.status === ProductStatus.BANNED && isAdmin) {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          status: ProductStatus.BANNED,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Produk berhasil dibanned',
        data: updatedProduct,
      })
    }

    // Jika seller mengubah status ke SOLD, validasi hanya boleh dari ACTIVE atau RESERVED
    if (validatedData.status === ProductStatus.SOLD && isSeller) {
      if (!(<ProductStatus[]>[ProductStatus.ACTIVE, ProductStatus.RESERVED]).includes(product.status)) {
        return NextResponse.json(
          { error: 'Status tidak dapat diubah ke SOLD' },
          { status: 400 }
        )
      }
    }

    // Update data
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Produk berhasil diperbarui',
      data: updatedProduct,
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate produk' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Menghapus produk (soft delete dengan status BANNED atau hard delete untuk seller sendiri)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anda harus login untuk menghapus produk' },
        { status: 401 }
      )
    }

    // Cek apakah produk ada
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validasi akses: Seller atau Admin
    const isSeller = product.sellerId === session.user.id
    const isAdmin = session.user.role === Role.ADMIN

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus produk ini' },
        { status: 403 }
      )
    }

    // Jika seller menghapus produk miliknya sendiri, soft delete
    if (isSeller) {
      await prisma.product.update({
        where: { id },
        data: { status: ProductStatus.BANNED },
      })
    } else {
      // Admin menghapus produk penjual lain
      await prisma.product.delete({
        where: { id },
      })
    }

    return NextResponse.json({
      message: isSeller
        ? 'Produk berhasil dihapus (dibanned)'
        : 'Produk berhasil dihapus permanen',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}
