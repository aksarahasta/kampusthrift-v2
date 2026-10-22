'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Role, ProductStatus } from '@prisma/client'
import { formatRupiah } from '@/lib/utils'

export default function AdminProductsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/products?${params.toString()}`)
      const json = await res.json()

      if (res.ok) {
        setProducts(json.data || [])
      }
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [statusFilter])

  const handleStatusChange = async (productId: string, newStatus: ProductStatus) => {
    setActionLoading(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        )
      }
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={40} />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <Button onClick={() => router.push('/')} className="mt-4 w-full">
            Kembali
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="gap-2 text-slate-600"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard Admin
          </Button>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="text-blue-600" size={24} />
                  Moderasi Produk
                </CardTitle>
                <CardDescription>
                  Kelola dan take-down postingan barang preloved yang melanggar aturan platform
                </CardDescription>
              </div>

              {/* Status Filters */}
              <div className="flex gap-2">
                {['ALL', 'ACTIVE', 'SOLD', 'BANNED'].map((st) => (
                  <Button
                    key={st}
                    variant={statusFilter === st ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(st)}
                    className="text-xs h-8"
                  >
                    {st === 'ALL' ? 'Semua' : st}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                fetchProducts()
              }}
              className="flex gap-2 pt-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Cari berdasarkan judul atau deskripsi produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm">
                Cari
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Tidak ada produk yang sesuai dengan filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 text-xs">
                      <th className="p-3">Produk</th>
                      <th className="p-3">Penjual</th>
                      <th className="p-3">Harga</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi Moderasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {product.media[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.media[0].mediaUrl}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-slate-400">
                                No img
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                                {product.title}
                              </p>
                              <p className="text-xs text-slate-500">{product.campusName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          <p className="font-medium text-slate-700">{product.seller.name}</p>
                          <p className="text-slate-400">{product.seller.email}</p>
                        </td>
                        <td className="p-3 text-xs font-semibold text-slate-700">
                          {formatRupiah(product.displayPrice)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              product.status === 'ACTIVE'
                                ? 'default'
                                : product.status === 'SOLD'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {product.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/products/${product.id}`, '_blank')}
                            className="h-8 w-8 p-0"
                            title="Lihat Produk"
                          >
                            <ExternalLink size={14} />
                          </Button>

                          {product.status !== 'BANNED' ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, ProductStatus.BANNED)}
                              disabled={actionLoading === product.id}
                              className="text-xs h-8"
                            >
                              {actionLoading === product.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                'Ban / Take Down'
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, ProductStatus.ACTIVE)}
                              disabled={actionLoading === product.id}
                              className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              {actionLoading === product.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                'Pulihkan'
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
