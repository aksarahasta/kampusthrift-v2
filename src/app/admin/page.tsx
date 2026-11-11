'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  Users,
  ShoppingBag,
  TrendingUp,
  Shield,
  MapPin,
  Settings,
  AlertCircle,
  Loader2,
  GraduationCap,
  Star,
  DollarSign,
  RefreshCw,
  Eye,
  Calendar,
  Wallet,
  ArrowUpRight,
  Receipt
} from 'lucide-react'
import { Role } from '@prisma/client'
import { formatRupiah } from '@/lib/utils'

interface PlatformStats {
  users: {
    total: number
    verifiedStudents: number
    recent: number
  }
  products: {
    active: number
    pendingPayment?: number
    sold: number
    reserved: number
    banned: number
    recent: number
    byCategory?: Array<{ category: string; _count: any }>
  }
  revenue: {
    total: number
    totalGmv: number
    thisMonth: number
    thisMonthGmv: number
    today: number
    potential: number
    soldCount: number
    averageMargin: number
  }
  visitors: {
    daily: Array<{ date: string; count: number; uniqueVisitors: number }>
    monthly: Array<{ month: string; count: number; uniqueVisitors: number }>
    totalVisits: number
    totalUniqueVisitors: number
    todayVisits: number
    thisMonthVisits: number
  }
  transactions: {
    total: number
  }
  reviews: {
    total: number
    avgHonestyScore: number
  }
  codZones: {
    total: number
  }
  systemConfig: {
    markupPercentage: number
    fixedFee: number
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visitorTab, setVisitorTab] = useState<'daily' | 'monthly'>('daily')

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/stats')
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || 'Gagal mengambil statistik')
        }

        setStats(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Card className="min-w-0 max-w-md w-full p-6 text-center space-y-4">
          <Shield className="mx-auto text-destructive" size={48} />
          <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-sm text-muted-foreground">
            Hanya administrator yang dapat mengakses dashboard ini.
          </p>
          <Button onClick={() => router.push('/')} className="min-h-11 w-full">
            Kembali ke Beranda
          </Button>
        </Card>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Card className="min-w-0 max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-warning" size={48} />
          <h2 className="text-xl font-bold text-foreground">Gagal Memuat Data</h2>
          <p className="text-sm text-muted-foreground">{error || 'Statistik tidak tersedia'}</p>
          <Button onClick={() => window.location.reload()} className="min-h-11 w-full">
            <RefreshCw size={16} className="mr-2" />
            Muat Ulang
          </Button>
        </Card>
      </div>
    )
  }

  const maxDailyCount = Math.max(...(stats.visitors?.daily?.map((d) => d.count) || [1]), 1)
  const maxMonthlyCount = Math.max(...(stats.visitors?.monthly?.map((m) => m.count) || [1]), 1)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card text-foreground">
        <div className="container min-w-0 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dashboard Pengelola</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Pantau pendapatan platform, statistik pengunjung harian/bulanan, dan aktivitas kampus.
              </p>
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:max-w-[50%]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="min-h-11 shrink-0 gap-2 text-sm font-medium"
              >
                <Users size={15} />
                Kelola User
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/products')}
                className="min-h-11 shrink-0 gap-2 text-sm font-medium relative"
              >
                <ShoppingBag size={15} />
                Produk
                {(stats.products.pendingPayment ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-warning/10 text-warning rounded-full">
                    {stats.products.pendingPayment}
                  </span>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/config')}
                className="min-h-11 shrink-0 gap-2 text-sm font-medium"
              >
                <Settings size={15} />
                Tarif Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container min-w-0 py-6 space-y-6">
        {/* Banner Notifikasi Pending Payment */}
        {(stats.products.pendingPayment ?? 0) > 0 && (
          <div className="bg-warning/10 text-foreground border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <Receipt size={22} className="text-warning" />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {stats.products.pendingPayment} Produk Menunggu Validasi Pembayaran
                </p>
                <p className="text-xs text-warning">
                  Penjual telah mengunggah bukti transfer listing fee. Segera periksa dan setujui untuk menampilkan di katalog.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin/products')}
              className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shrink-0"
              size="sm"
            >
              Periksa Sekarang
            </Button>
          </div>
        )}

        {/* SECTION 1: PENDAPATAN PLATFORM (PAY-PER-LISTING REVENUE) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Wallet className="text-success" size={20} />
              Pendapatan Platform (Biaya Pasang Iklan / Listing Fee)
            </h2>
            <span className="text-xs text-muted-foreground">
              Tarif Listing: {formatRupiah((stats.systemConfig as any)?.listingFee ?? 2000)} / postingan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pendapatan Bersih */}
            <Card className="min-w-0 border-border bg-card">
              <CardContent className="min-w-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-success">
                    Total Pendapatan Listing
                  </span>
                  <div className="w-8 h-8 shrink-0 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="min-w-0 break-words text-2xl font-bold text-success mt-2">
                  {formatRupiah(stats.revenue?.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Akumulasi biaya posting iklan dari penjual
                </p>
              </CardContent>
            </Card>

            {/* Pendapatan Bulan Ini */}
            <Card className="min-w-0 border-border bg-card">
              <CardContent className="min-w-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-primary">
                    Bulan Ini ({new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})
                  </span>
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="min-w-0 break-words text-2xl font-bold text-primary mt-2">
                  {formatRupiah(stats.revenue?.thisMonth || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume transaksi barang (GMV): {formatRupiah(stats.revenue?.thisMonthGmv || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Pendapatan Hari Ini */}
            <Card className="min-w-0 border-border">
              <CardContent className="min-w-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground">
                    Hari Ini
                  </span>
                  <div className="w-8 h-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="min-w-0 text-xl sm:text-2xl font-bold text-foreground mt-2">
                  {formatRupiah(stats.revenue?.today || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Biaya listing yang masuk hari ini
                </p>
              </CardContent>
            </Card>

            {/* Nilai Listing Aktif */}
            <Card className="min-w-0 border-border bg-card">
              <CardContent className="min-w-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-primary">
                    Listing Aktif
                  </span>
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div className="min-w-0 break-words text-2xl font-bold text-primary mt-2">
                  {stats.products.active} Barang
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sedang aktif tayang di katalog kampus
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: HISTORY PENGUNJUNG (VISITOR HISTORY) */}
        <Card className="border-border">
          <CardHeader className="min-w-0 p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-lg font-bold flex items-center gap-2 text-foreground">
                  <Eye className="text-primary" size={20} />
                  History & Statistik Pengunjung
                </CardTitle>
                <CardDescription className="break-words">
                  Aktivitas kunjungan pengguna per hari dan per bulan ke platform Kampus Thrift
                </CardDescription>
              </div>

              {/* Tab Selector Harian / Bulanan */}
              <div className="flex w-full min-w-0 items-center gap-1 overflow-x-auto bg-muted p-1 rounded-lg sm:w-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setVisitorTab('daily')}
                  aria-pressed={visitorTab === 'daily'}
                  className={`min-h-11 shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    visitorTab === 'daily'
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Per Hari (7 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => setVisitorTab('monthly')}
                  aria-pressed={visitorTab === 'monthly'}
                  className={`min-h-11 shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    visitorTab === 'monthly'
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Per Bulan (6 Bulan)
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0 space-y-6">
            {/* Quick Visitor Stats Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-xs text-muted-foreground">Kunjungan Hari Ini</p>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {stats.visitors?.todayVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-xs text-muted-foreground">Bulan Ini</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {stats.visitors?.thisMonthVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-xs text-muted-foreground">Total Kunjungan</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {stats.visitors?.totalVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-xs text-muted-foreground">Pengunjung Unik</p>
                <p className="text-xl font-bold text-success mt-0.5">
                  {stats.visitors?.totalUniqueVisitors || 1}
                </p>
              </div>
            </div>

            {/* Visual Bars Breakdown */}
            {visitorTab === 'daily' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-muted-foreground pb-1 border-b">
                  <span>Tanggal</span>
                  <span className="flex gap-4">
                    <span>Unik</span>
                    <span className="w-20 text-right">Total Hits</span>
                  </span>
                </div>
                {stats.visitors?.daily?.map((d) => {
                  const percentage = Math.round((d.count / maxDailyCount) * 100)
                  const isToday = d.date === new Date().toISOString().slice(0, 10)
                  return (
                    <div key={d.date} className="min-w-0 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                        <span className={`font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                          {new Date(d.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {isToday && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Hari Ini</span>}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">{d.uniqueVisitors} unik</span>
                          <span className="w-20 text-right font-semibold text-foreground">
                            {d.count} kunjungan
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isToday ? 'bg-primary' : 'bg-primary/50'
                          }`}
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-muted-foreground pb-1 border-b">
                  <span>Bulan</span>
                  <span className="flex gap-4">
                    <span>Unik</span>
                    <span className="w-20 text-right">Total Kunjungan</span>
                  </span>
                </div>
                {stats.visitors?.monthly?.map((m) => {
                  const percentage = Math.round((m.count / maxMonthlyCount) * 100)
                  return (
                    <div key={m.month} className="min-w-0 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">{m.month}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">{m.uniqueVisitors} unik</span>
                          <span className="w-20 text-right font-semibold text-foreground">
                            {m.count} kunjungan
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: RINGKASAN PLATFORM UMUM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card>
            <CardContent className="min-w-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Pengguna Terdaftar</p>
                <p className="min-w-0 text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <GraduationCap size={12} className="text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {stats.users.verifiedStudents} verified student
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Active Products */}
          <Card>
            <CardContent className="min-w-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Barang Aktif Dijual</p>
                <p className="text-2xl font-bold text-success mt-1">{stats.products.active.toLocaleString()}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.products.sold} terjual, {stats.products.banned} dibanned
                </div>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="text-success" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card>
            <CardContent className="min-w-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Transaksi Selesai</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.transactions.total.toLocaleString()}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.products.recent} listing baru (7 hari)
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="text-primary" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Honesty Score */}
          <Card>
            <CardContent className="min-w-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Honesty Score Rata-rata</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {stats.reviews.avgHonestyScore.toFixed(1)}/5.0
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.reviews.total} ulasan terverifikasi
                </div>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <Star className="text-warning" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Config & COD Zones */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Config */}
          <Card>
            <CardHeader className="min-w-0 p-4 sm:p-6">
              <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-lg flex items-center gap-2">
                <DollarSign size={20} />
                Konfigurasi Margin & Fee Platform
              </CardTitle>
              <CardDescription className="break-words">
                Formula transparansi: P_display = P_base + (P_base × % + Fixed Fee)
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs text-primary">Persentase Markup</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.systemConfig.markupPercentage}%
                  </p>
                  <p className="text-xs text-primary mt-1">dari harga dasar penjual</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs text-primary">Biaya Tetap (Fixed Fee)</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(stats.systemConfig.fixedFee)}
                  </p>
                  <p className="text-xs text-primary mt-1">per transaksi sukses</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/config')}
                className="min-h-11 w-full whitespace-normal h-auto py-3 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Settings size={16} className="mr-2" />
                Ubah Pengaturan Markup
              </Button>
            </CardContent>
          </Card>

          {/* COD Zones */}
          <Card>
            <CardHeader className="min-w-0 p-4 sm:p-6">
              <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-lg flex items-center gap-2">
                <MapPin size={20} />
                COD Safe Zones Kampus
              </CardTitle>
              <CardDescription className="break-words">
                Titik temu resmi COD yang aman dan diawasi di lingkungan kampus
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="bg-success/10 p-4 rounded-lg text-center">
                <p className="text-4xl font-bold text-success mb-1">
                  {stats.codZones.total}
                </p>
                <p className="text-xs font-semibold text-success">Titik Temu COD Safe Zone Aktif</p>
                <p className="text-xs text-success mt-1">
                  Mendukung transaksi tatap muka aman dengan Rp 0 ongkir
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/cod-zones')}
                className="min-h-11 w-full mt-4"
              >
                <MapPin size={16} className="mr-2" />
                Kelola Titik Temu COD
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
