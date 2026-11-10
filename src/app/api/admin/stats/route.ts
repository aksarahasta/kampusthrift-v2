import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'
import { getVisitorStats } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Mengambil statistik platform lengkap: Pengguna, Produk, Pendapatan (Markup), & Pengunjung
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

    // 1. Total Users
    const totalUsers = await prisma.user.count({
      where: { role: Role.USER },
    })

    const verifiedStudents = await prisma.user.count({
      where: {
        role: Role.USER,
        isVerifiedStudent: true,
      },
    })

    // 2. Products Counts
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

    const pendingPaymentProducts = await prisma.product.count({
      where: { status: ProductStatus.PENDING_PAYMENT },
    })

    // 3. Revenue & Transaction Metrics (Model Pay-per-Listing: dari Biaya Listing yang dibayar penjual)
    // Hanya hitung pendapatan dari produk yang sudah tervalidasi (bukan PENDING_PAYMENT atau REJECTED)
    const allProducts = await prisma.product.findMany({
      where: {
        status: {
          notIn: [ProductStatus.PENDING_PAYMENT, ProductStatus.REJECTED],
        },
      },
      select: {
        id: true,
        title: true,
        listingFeePaid: true,
        displayPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // Total pendapatan platform dari biaya listing iklan yang dibayar penjual
    const totalRevenue = allProducts.reduce((sum, p) => sum + (p.listingFeePaid ?? 2000), 0)

    const thisMonthProducts = allProducts.filter((p) => new Date(p.createdAt) >= startOfCurrentMonth)
    const thisMonthRevenue = thisMonthProducts.reduce((sum, p) => sum + (p.listingFeePaid ?? 2000), 0)

    const todayProducts = allProducts.filter((p) => new Date(p.createdAt) >= startOfToday)
    const todayRevenue = todayProducts.reduce((sum, p) => sum + (p.listingFeePaid ?? 2000), 0)

    // GMV Transaksi Barang Terjual
    const soldItems = allProducts.filter((p) => p.status === ProductStatus.SOLD)
    const totalGmv = soldItems.reduce((sum, p) => sum + p.displayPrice, 0)
    const thisMonthSoldItems = soldItems.filter((p) => new Date(p.updatedAt) >= startOfCurrentMonth)
    const thisMonthGmv = thisMonthSoldItems.reduce((sum, p) => sum + p.displayPrice, 0)

    // Tarif listing aktif saat ini dari SystemConfig
    const systemConfig = await prisma.systemConfig.findFirst()
    const currentListingFee = systemConfig?.listingFee ?? 2000
    const potentialRevenue = allProducts.filter(p => p.status === ProductStatus.ACTIVE).length * currentListingFee

    // 4. Honesty Scores & Reviews
    const usersWithReviews = await prisma.user.findMany({
      where: {
        role: Role.USER,
        honestyScore: { gt: 0 },
      },
      select: { honestyScore: true },
    })

    const avgHonestyScore =
      usersWithReviews.length > 0
        ? usersWithReviews.reduce((sum, u) => sum + u.honestyScore, 0) / usersWithReviews.length
        : 0

    const totalReviews = await prisma.review.count()

    // 5. Products by Category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      where: { status: ProductStatus.ACTIVE },
      _count: true,
    })

    // 6. Recent Trends (Last 7 Days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentProducts = await prisma.product.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: ProductStatus.BANNED },
      },
    })

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        role: Role.USER,
      },
    })

    // 7. COD Safe Zones
    const totalCodZones = await prisma.codZone.count({
      where: { isActive: true },
    })

    // 8. System Config (already fetched above as systemConfig)

    // 9. Visitor Stats (Daily & Monthly)
    const visitorStats = await getVisitorStats()

    return NextResponse.json({
      data: {
        users: {
          total: totalUsers,
          verifiedStudents,
          recent: recentUsers,
        },
        products: {
          active: activeProducts,
          pendingPayment: pendingPaymentProducts,
          sold: soldProducts,
          reserved: reservedProducts,
          banned: bannedProducts,
          recent: recentProducts,
          byCategory: productsByCategory,
        },
        revenue: {
          total: totalRevenue,
          totalGmv,
          thisMonth: thisMonthRevenue,
          thisMonthGmv,
          today: todayRevenue,
          potential: potentialRevenue,
          soldCount: soldProducts,
          averageMargin: soldProducts > 0 ? Math.round(totalRevenue / soldProducts) : 0,
        },
        visitors: visitorStats,
        transactions: {
          total: soldProducts,
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
