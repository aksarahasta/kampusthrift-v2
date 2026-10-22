import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'

/**
 * GET /api/admin/stats
 * Mengambil statistik platform untuk dashboard admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    // Total Users
    const totalUsers = await prisma.user.count({
      where: { role: Role.USER },
    })

    // Verified Students
    const verifiedStudents = await prisma.user.count({
      where: {
        role: Role.USER,
        isVerifiedStudent: true
      },
    })

    // Total Products by Status
    const activeProducts = await prisma.product.count({
      where: { status: ProductStatus.ACTIVE },
    })

    const soldProducts = await prisma.product.count({
      where: { status: ProductStatus.SOLD },
    })

    const reservedProducts = await prisma.product.count({
      where: { status: ProductStatus.RESERVED },
    })

    const bannedProducts = await prisma.product.count({
      where: { status: ProductStatus.BANNED },
    })

    // Total Transactions (SOLD products)
    const totalTransactions = soldProducts

    // Average Honesty Score
    const usersWithReviews = await prisma.user.findMany({
      where: {
        role: Role.USER,
        honestyScore: { gt: 0 }
      },
      select: { honestyScore: true },
    })

    const avgHonestyScore = usersWithReviews.length > 0
      ? usersWithReviews.reduce((sum, u) => sum + u.honestyScore, 0) / usersWithReviews.length
      : 0

    // Total Reviews
    const totalReviews = await prisma.review.count()

    // Products by Category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      where: { status: ProductStatus.ACTIVE },
      _count: true,
    })

    // Recent Products (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentProducts = await prisma.product.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: ProductStatus.BANNED },
      },
    })

    // Recent Users (last 7 days)
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        role: Role.USER,
      },
    })

    // Total COD Zones
    const totalCodZones = await prisma.codZone.count({
      where: { isActive: true },
    })

    // System Config
    const systemConfig = await prisma.systemConfig.findFirst()

    return NextResponse.json({
      data: {
        users: {
          total: totalUsers,
          verifiedStudents,
          recent: recentUsers,
        },
        products: {
          active: activeProducts,
          sold: soldProducts,
          reserved: reservedProducts,
          banned: bannedProducts,
          recent: recentProducts,
          byCategory: productsByCategory,
        },
        transactions: {
          total: totalTransactions,
        },
        reviews: {
          total: totalReviews,
          avgHonestyScore: Math.round(avgHonestyScore * 10) / 10,
        },
        codZones: {
          total: totalCodZones,
        },
        systemConfig: {
          markupPercentage: systemConfig?.markupPercentage ?? 5.0,
          fixedFee: systemConfig?.fixedFee ?? 1000,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}
