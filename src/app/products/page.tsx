'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/cards/product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  MapPin,
  GraduationCap,
  RefreshCw,
  SlidersHorizontal,
  Loader2
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

interface CodZone {
  id: string
  campusName: string
  locationName: string
}

function CatalogContent() {
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'ALL')
  const [codZones, setCodZones] = useState<CodZone[]>([])
  const [codZoneId, setCodZoneId] = useState(searchParams.get('codZoneId') || '')
  const [isBarter, setIsBarter] = useState<boolean>(searchParams.get('isBarter') === 'true')
  const [verifiedStudentOnly, setVerifiedStudentOnly] = useState<boolean>(
    searchParams.get('verifiedStudentOnly') === 'true'
  )

  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchCodZones() {
      try {
        const response = await fetch('/api/cod-zones')
        const json = await response.json()
        if (response.ok) setCodZones(json.data || [])
      } catch (error) {
        console.error('Failed to fetch COD zones:', error)
      }
    }
    fetchCodZones()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'ALL') params.set('category', category)

      if (isBarter) params.set('isBarter', 'true')
      if (verifiedStudentOnly) params.set('verifiedStudentOnly', 'true')
      if (codZoneId) params.set('codZoneId', codZoneId)

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
  }, [category, codZoneId, isBarter, verifiedStudentOnly])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const resetFilters = () => {
    setCategory('ALL')

    setIsBarter(false)
    setVerifiedStudentOnly(false)
    setCodZoneId('')
    setSearch('')
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top Search & Filter Bar */}
      <div className="catalog-toolbar">
        <div className="container py-4 space-y-3">
          <h1 className="text-2xl sm:text-3xl">Katalog preloved</h1>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
              <Input
                placeholder="Cari barang preloved…"
                aria-label="Cari barang preloved"
                type="search"
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
              aria-label={showFilters ? 'Tutup filter' : 'Buka filter'}
              aria-expanded={showFilters}
              aria-controls="catalog-filters"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
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
                className="shrink-0 whitespace-nowrap text-sm"
                aria-pressed={category === cat.value}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Filter Drawer / Expanded Box */}
          {showFilters && (
            <div id="catalog-filters" className="mt-2 max-h-[45dvh] overflow-y-auto rounded-md bg-muted p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-base text-foreground">Filter tambahan</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-sm text-primary"
                >
                  Reset Filter
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="min-w-0 space-y-1">
                  <label htmlFor="catalog-cod-zone" className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <MapPin size={14} aria-hidden="true" />
                    Titik COD
                  </label>
                  <select
                    id="catalog-cod-zone"
                    value={codZoneId}
                    onChange={(event) => setCodZoneId(event.target.value)}
                    className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Semua titik COD</option>
                    {codZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.locationName} — {zone.campusName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barter Toggle */}
                <div className="flex items-center gap-2 pt-3">
                  <input
                    type="checkbox"
                    id="barterCheck"
                    checked={isBarter}
                    onChange={(e) => setIsBarter(e.target.checked)}
                    className="rounded border-input accent-primary"
                  />
                  <label htmlFor="barterCheck" className="text-sm font-medium text-foreground flex items-center gap-1">
                    <RefreshCw size={14} className="text-primary" aria-hidden="true" />
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
                    className="rounded border-input accent-primary"
                  />
                  <label htmlFor="studentCheck" className="text-sm font-medium text-foreground flex items-center gap-1">
                    <GraduationCap size={14} className="text-primary" aria-hidden="true" />
                    Penjual Mahasiswa (.ac.id)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Product Grid */}
      <div className="container py-6">
        {loading ? (
          <div role="status" className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={32} className="motion-safe:animate-spin text-primary mb-2" aria-hidden="true" />
            <p className="text-sm">Memuat katalog produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Search size={24} />
            </div>
            <h2 className="mx-auto font-semibold text-foreground text-xl">Tidak ada produk ditemukan</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau pilih titik COD yang lain.
            </p>
            <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4">
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan <strong>{products.length}</strong> barang preloved
              </p>
            </div>
            <div className="product-grid">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index === 0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat katalog...</div>}>
      <CatalogContent />
    </Suspense>
  )
}
