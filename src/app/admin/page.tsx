'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ArrowUpRight
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <Shield className="mx-auto text-red-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-sm text-slate-600">
            Hanya administrator yang dapat mengakses dashboard ini.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Kembali ke Beranda
          </Button>
        </Card>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Gagal Memuat Data</h2>
          <p className="text-sm text-slate-600">{error || 'Statistik tidak tersedia'}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
                  Admin Panel
                </Badge>
                <span className="text-xs text-blue-200">Kampus Thrift Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dashboard Pengelola</h1>
              <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
                Pantau pendapatan platform, statistik pengunjung harian/bulanan, dan aktivitas kampus.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="gap-1.5 text-xs font-medium"
              >
                <Users size={15} />
                Kelola User
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/products')}
                className="gap-1.5 text-xs font-medium"
              >
                <ShoppingBag size={15} />
                Produk
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/config')}
                className="gap-1.5 text-xs font-medium"
              >
                <Settings size={15} />
                Tarif Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* SECTION 1: PENDAPATAN PLATFORM (PAY-PER-LISTING REVENUE) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="text-emerald-600" size={20} />
              Pendapatan Platform (Biaya Pasang Iklan / Listing Fee)
            </h2>
            <span className="text-xs text-slate-500">
              Tarif Listing: {formatRupiah((stats.systemConfig as any)?.listingFee ?? 2000)} / postingan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pendapatan Bersih */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    Total Pendapatan Listing
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-2">
                  {formatRupiah(stats.revenue?.total || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Akumulasi biaya posting iklan dari penjual
                </p>
              </CardContent>
            </Card>

            {/* Pendapatan Bulan Ini */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Bulan Ini ({new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-2">
                  {formatRupiah(stats.revenue?.thisMonth || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Volume transaksi barang (GMV): {formatRupiah(stats.revenue?.thisMonthGmv || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Pendapatan Hari Ini */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Hari Ini
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-2">
                  {formatRupiah(stats.revenue?.today || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Biaya listing yang masuk hari ini
                </p>
              </CardContent>
            </Card>

            {/* Nilai Listing Aktif */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
                    Listing Aktif
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-700 mt-2">
                  {stats.products.active} Barang
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sedang aktif tayang di katalog kampus
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: HISTORY PENGUNJUNG (VISITOR HISTORY) */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Eye className="text-blue-600" size={20} />
                  History & Statistik Pengunjung
                </CardTitle>
                <CardDescription>
                  Aktivitas kunjungan pengguna per hari dan per bulan ke platform Kampus Thrift
                </CardDescription>
              </div>

              {/* Tab Selector Harian / Bulanan */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setVisitorTab('daily')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    visitorTab === 'daily'
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Hari (7 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => setVisitorTab('monthly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    visitorTab === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Bulan (6 Bulan)
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick Visitor Stats Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">Kunjungan Hari Ini</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">
                  {stats.visitors?.todayVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">Bulan Ini</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {stats.visitors?.thisMonthVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">Total Kunjungan</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {stats.visitors?.totalVisits || 1}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">Pengunjung Unik</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {stats.visitors?.totalUniqueVisitors || 1}
                </p>
              </div>
            </div>

            {/* Visual Bars Breakdown */}
            {visitorTab === 'daily' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 pb-1 border-b">
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
                    <div key={d.date} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                          {new Date(d.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {isToday && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Hari Ini</span>}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-400">{d.uniqueVisitors} unik</span>
                          <span className="w-20 text-right font-semibold text-slate-800">
                            {d.count} kunjungan
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isToday ? 'bg-blue-600' : 'bg-blue-400'
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
                <div className="flex justify-between items-center text-xs text-slate-500 pb-1 border-b">
                  <span>Bulan</span>
                  <span className="flex gap-4">
                    <span>Unik</span>
                    <span className="w-20 text-right">Total Kunjungan</span>
                  </span>
                </div>
                {stats.visitors?.monthly?.map((m) => {
                  const percentage = Math.round((m.count / maxMonthlyCount) * 100)
                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{m.month}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-400">{m.uniqueVisitors} unik</span>
                          <span className="w-20 text-right font-semibold text-slate-800">
                            {m.count} kunjungan
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
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
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Pengguna Terdaftar</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <GraduationCap size={12} className="text-blue-500" />
                  <span className="text-xs text-slate-600">
                    {stats.users.verifiedStudents} verified student
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Active Products */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Barang Aktif Dijual</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.products.active.toLocaleString()}</p>
                <div className="text-xs text-slate-600 mt-1">
                  {stats.products.sold} terjual • {stats.products.banned} dibanned
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="text-emerald-600" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Transaksi Selesai</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.transactions.total.toLocaleString()}</p>
                <div className="text-xs text-slate-600 mt-1">
                  {stats.products.recent} listing baru (7 hari)
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </CardContent>
          </Card>

          {/* Honesty Score */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Honesty Score Rata-rata</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">
                  {stats.reviews.avgHonestyScore.toFixed(1)}/5.0
                </p>
                <div className="text-xs text-slate-600 mt-1">
                  {stats.reviews.total} ulasan terverifikasi
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Star className="text-amber-600" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Config & COD Zones */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign size={20} />
                Konfigurasi Margin & Fee Platform
              </CardTitle>
              <CardDescription>
                Formula transparansi: P_display = P_base + (P_base × % + Fixed Fee)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">Persentase Markup</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.systemConfig.markupPercentage}%
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">dari harga dasar penjual</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">Biaya Tetap (Fixed Fee)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatRupiah(stats.systemConfig.fixedFee)}
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">per transaksi sukses</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/config')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Settings size={16} className="mr-2" />
                Ubah Pengaturan Markup
              </Button>
            </CardContent>
          </Card>

          {/* COD Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin size={20} />
                COD Safe Zones Kampus
              </CardTitle>
              <CardDescription>
                Titik temu resmi COD yang aman dan diawasi di lingkungan kampus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <p className="text-4xl font-bold text-emerald-600 mb-1">
                  {stats.codZones.total}
                </p>
                <p className="text-xs font-semibold text-emerald-800">Titik Temu COD Safe Zone Aktif</p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  Mendukung transaksi tatap muka aman dengan Rp 0 ongkir
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/cod-zones')}
                className="w-full mt-4"
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
