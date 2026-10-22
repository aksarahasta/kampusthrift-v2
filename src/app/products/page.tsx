'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/cards/product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  RefreshCw,
  SlidersHorizontal,
  Loader2,
  X
} from 'lucide-react'
import { ProductCategory } from '@prisma/client'

const categories: { label: string; value: ProductCategory | 'ALL' }[] = [
  { label: 'Semua Kategori', value: 'ALL' },
  { label: 'Buku Kuliah', value: 'BUKU_KULIAH' },
  { label: 'Alat Kos & RT', value: 'ALAT_KOS_RUMAH_TANGGA' },
  { label: 'Elektronik', value: 'ELEKTRONIK' },
  { label: 'Fashion', value: 'FASHION' },
  { label: 'Lain-lain', value: 'LAIN_LAIN' },
]

function CatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'ALL')
  const [radiusKm, setRadiusKm] = useState<number>(parseInt(searchParams.get('radiusKm') || '5'))
  const [isBarter, setIsBarter] = useState<boolean>(searchParams.get('isBarter') === 'true')
  const [verifiedStudentOnly, setVerifiedStudentOnly] = useState<boolean>(
    searchParams.get('verifiedStudentOnly') === 'true'
  )
  const [campusName, setCampusName] = useState(searchParams.get('campusName') || '')
  const [showFilters, setShowFilters] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'ALL') params.set('category', category)
      if (radiusKm) params.set('radiusKm', radiusKm.toString())
      if (isBarter) params.set('isBarter', 'true')
      if (verifiedStudentOnly) params.set('verifiedStudentOnly', 'true')
      if (campusName) params.set('campusName', campusName)

      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setProducts(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [category, radiusKm, isBarter, verifiedStudentOnly, campusName])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const resetFilters = () => {
    setCategory('ALL')
    setRadiusKm(5)
    setIsBarter(false)
    setVerifiedStudentOnly(false)
    setCampusName('')
    setSearch('')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Cari buku, elektronik, pakaian preloved..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Cari</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </form>

          {/* Quick Categories Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                size="sm"
                variant={category === cat.value ? 'default' : 'outline'}
                onClick={() => setCategory(cat.value)}
                className="whitespace-nowrap text-xs h-8"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Filter Drawer / Expanded Box */}
          {showFilters && (
            <Card className="p-4 bg-slate-50 border-slate-200 mt-2 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-slate-800">Filter Tambahan</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-blue-600 h-7"
                >
                  Reset Filter
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {/* Radius Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <MapPin size={12} />
                    Radius Kampus: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 km</span>
                    <span>3 km</span>
                    <span>5 km</span>
                  </div>
                </div>

                {/* Campus Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nama Kampus</label>
                  <Input
                    placeholder="cth. Universitas Indonesia"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Barter Toggle */}
                <div className="flex items-center gap-2 pt-3">
                  <input
                    type="checkbox"
                    id="barterCheck"
                    checked={isBarter}
                    onChange={(e) => setIsBarter(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="barterCheck" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <RefreshCw size={12} className="text-purple-600" />
                    Hanya Barang Barter
                  </label>
                </div>

                {/* Verified Student Toggle */}
                <div className="flex items-center gap-2 pt-3">
                  <input
                    type="checkbox"
                    id="studentCheck"
                    checked={verifiedStudentOnly}
                    onChange={(e) => setVerifiedStudentOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="studentCheck" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <GraduationCap size={14} className="text-blue-600" />
                    Penjual Mahasiswa (.ac.id)
                  </label>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content Product Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Memuat katalog produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Tidak ada produk ditemukan</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter radius jarak kampus Anda.
            </p>
            <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4">
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">
                Menampilkan <strong>{products.length}</strong> barang preloved
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat katalog...</div>}>
      <CatalogContent />
    </Suspense>
  )
}
