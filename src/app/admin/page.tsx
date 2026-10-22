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
  RefreshCw
} from 'lucide-react'
import { Role } from '@prisma/client'

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Monitor & Kelola Platform Kampus Thrift</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="gap-2"
              >
                <Users size={16} />
                Kelola User
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/config')}
                className="gap-2"
              >
                <Settings size={16} />
                Konfigurasi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pengguna</p>
                <p className="text-2xl font-bold text-slate-800">{stats.users.total.toLocaleString()}</p>
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
                <p className="text-sm text-slate-500">Barang Aktif</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.products.active.toLocaleString()}</p>
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
                <p className="text-sm text-slate-500">Total Transaksi</p>
                <p className="text-2xl font-bold text-purple-600">{stats.transactions.total.toLocaleString()}</p>
                <div className="text-xs text-slate-600 mt-1">
                  {stats.products.recent} baru (7 hari)
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
                <p className="text-sm text-slate-500">Honesty Score Avg</p>
                <p className="text-2xl font-bold text-amber-500">
                  {stats.reviews.avgHonestyScore.toFixed(1)}/5.0
                </p>
                <div className="text-xs text-slate-600 mt-1">
                  {stats.reviews.total} ulasan
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
                Konfigurasi Markup Harga
              </CardTitle>
              <CardDescription>
                Pengaturan markup platform yang berlaku untuk semua transaksi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Persentase Markup</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.systemConfig.markupPercentage}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">dari harga dasar (P_base)</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Biaya Tetap</p>
                  <p className="text-2xl font-bold text-blue-900">
                    Rp {stats.systemConfig.fixedFee.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">per transaksi</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/config')}
                className="w-full"
              >
                <Settings size={16} className="mr-2" />
                Edit Konfigurasi
              </Button>
            </CardContent>
          </Card>

          {/* COD Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin size={20} />
                COD Safe Zones
              </CardTitle>
              <CardDescription>
                Titik temu aman transaksi kampus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <p className="text-4xl font-bold text-emerald-600 mb-2">
                  {stats.codZones.total}
                </p>
                <p className="text-sm text-emerald-700">Lokasi Aktif</p>
                <p className="text-xs text-emerald-600 mt-2">
                  Titik COD aktif di berbagai kampus
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/cod-zones')}
                className="w-full mt-4"
              >
                <MapPin size={16} className="mr-2" />
                Kelola Lokasi COD
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Akses cepat untuk mengelola platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/products')}
                className="flex flex-col items-center justify-center h-24 gap-2"
              >
                <ShoppingBag size={20} />
                <span className="text-sm">Moderasi Produk</span>
                <span className="text-xs text-slate-500">
                  {stats.products.active} aktif
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/users')}
                className="flex flex-col items-center justify-center h-24 gap-2"
              >
                <Users size={20} />
                <span className="text-sm">Kelola User</span>
                <span className="text-xs text-slate-500">
                  {stats.users.total} total
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/cod-zones')}
                className="flex flex-col items-center justify-center h-24 gap-2"
              >
                <MapPin size={20} />
                <span className="text-sm">COD Zones</span>
                <span className="text-xs text-slate-500">
                  {stats.codZones.total} lokasi
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/reports')}
                className="flex flex-col items-center justify-center h-24 gap-2"
              >
                <BarChart3 size={20} />
                <span className="text-sm">Reports & Analytics</span>
                <span className="text-xs text-slate-500">
                  Performance data
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
            <CardDescription>
              7 hari terakhir platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Pengguna Baru</p>
                <p className="text-2xl font-bold text-blue-600">+{stats.users.recent}</p>
                <p className="text-xs text-slate-500">dalam 7 hari</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Produk Baru</p>
                <p className="text-2xl font-bold text-emerald-600">+{stats.products.recent}</p>
                <p className="text-xs text-slate-500">listing baru</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Student Verified</p>
                <p className="text-2xl font-bold text-purple-600">{stats.users.verifiedStudents}</p>
                <p className="text-xs text-slate-500">mahasiswa terverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
