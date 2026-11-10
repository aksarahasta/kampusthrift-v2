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
  AlertCircle,
  Clock,
  Receipt,
  Eye,
  X
} from 'lucide-react'
import { Role, ProductStatus } from '@prisma/client'
import { formatRupiah } from '@/lib/utils'

export default function AdminProductsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_PAYMENT')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Proof preview modal
  const [previewProof, setPreviewProof] = useState<string | null>(null)

  // Reject modal state
  const [rejectingProduct, setRejectingProduct] = useState<any | null>(null)
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('Nominal transfer tidak sesuai dengan tarif listing')
  const [customReason, setCustomReason] = useState<string>('')

  const PRESET_REASONS = [
    'Nominal transfer tidak sesuai dengan tarif listing',
    'Screenshot bukti transfer buram atau tidak terbaca',
    'Nama pengirim atau mutasi belum masuk ke rekening admin',
    'Bukan bukti transfer resmi platform KampusThrift',
    'Bukti transfer duplikat / pernah digunakan sebelumnya',
    'Lainnya',
  ]

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

  const handleValidatePayment = async (
    productId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    setActionLoading(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })

      if (res.ok) {
        // Remove from list after action if filtering by PENDING_PAYMENT
        if (statusFilter === 'PENDING_PAYMENT') {
          setProducts((prev) => prev.filter((p) => p.id !== productId))
        } else {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === productId
                ? {
                    ...p,
                    status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
                    rejectionReason: action === 'REJECT' ? reason : null,
                  }
                : p
            )
          )
        }
        setRejectingProduct(null)
      }
    } catch (err) {
      console.error('Failed to validate payment', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmReject = () => {
    if (!rejectingProduct) return
    const finalReason =
      selectedPresetReason === 'Lainnya'
        ? customReason.trim() || 'Bukti transfer tidak valid.'
        : selectedPresetReason
    handleValidatePayment(rejectingProduct.id, 'REJECT', finalReason)
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PENDING_PAYMENT':
        return <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">⏳ Menunggu Validasi</Badge>
      case 'ACTIVE':
        return <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200">✅ Aktif</Badge>
      case 'SOLD':
        return <Badge variant="secondary" className="text-[10px]">Terjual</Badge>
      case 'BANNED':
        return <Badge variant="destructive" className="text-[10px]">Banned</Badge>
      case 'REJECTED':
        return <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200">❌ Ditolak</Badge>
      default:
        return <Badge className="text-[10px]">{st}</Badge>
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

  const pendingCount = products.filter((p) => p.status === 'PENDING_PAYMENT').length

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      {/* Proof Preview Modal */}
      {previewProof && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewProof(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewProof(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10"
            >
              <X size={18} className="text-slate-700" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewProof}
              alt="Bukti Pembayaran"
              className="w-full rounded-xl shadow-2xl"
            />
            <p className="text-center text-white text-xs mt-3 opacity-70">Klik di luar untuk menutup</p>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingProduct && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setRejectingProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <XCircle size={20} />
                Tolak Bukti Pembayaran
              </div>
              <button
                onClick={() => setRejectingProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">Produk yang ditolak:</p>
              <p className="font-semibold text-sm text-slate-800 line-clamp-1">
                {rejectingProduct.title}
              </p>
              <p className="text-xs text-slate-500">
                Penjual: {rejectingProduct.seller?.name} ({rejectingProduct.seller?.email})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Alasan Penolakan:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedPresetReason === reason
                        ? 'border-red-500 bg-red-50/70 text-red-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="presetReason"
                      value={reason}
                      checked={selectedPresetReason === reason}
                      onChange={(e) => setSelectedPresetReason(e.target.value)}
                      className="mt-0.5 text-red-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedPresetReason === 'Lainnya' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tuliskan Alasan Khusus:
                </label>
                <Input
                  placeholder="Contoh: Bukti buram, mohon upload ulang..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingProduct(null)}
                disabled={actionLoading === rejectingProduct.id}
                className="w-1/2 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectingProduct.id}
                className="w-1/2 text-xs gap-1.5 bg-red-600 hover:bg-red-700"
              >
                {actionLoading === rejectingProduct.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <XCircle size={13} />
                )}
                Konfirmasi Tolak
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  Validasi bukti bayar listing fee &amp; kelola postingan produk
                </CardDescription>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'PENDING_PAYMENT', label: 'Menunggu Validasi' },
                  { key: 'ALL', label: 'Semua' },
                  { key: 'ACTIVE', label: 'Aktif' },
                  { key: 'REJECTED', label: 'Ditolak' },
                  { key: 'BANNED', label: 'Banned' },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={statusFilter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(key)}
                    className={`text-xs h-8 ${key === 'PENDING_PAYMENT' && statusFilter !== key ? 'border-amber-400 text-amber-700' : ''}`}
                  >
                    {key === 'PENDING_PAYMENT' && <Clock size={12} className="mr-1" />}
                    {label}
                    {key === 'PENDING_PAYMENT' && pendingCount > 0 && statusFilter === 'PENDING_PAYMENT' && (
                      <span className="ml-1 bg-amber-500 text-white text-[9px] rounded-full px-1.5 py-px">
                        {pendingCount}
                      </span>
                    )}
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
              className="flex gap-2 mt-4"
            >
              <Input
                placeholder="Cari produk atau penjual..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm"
              />
              <Button type="submit" variant="outline" size="sm" className="gap-1 shrink-0">
                <Search size={14} />
                Cari
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {statusFilter === 'PENDING_PAYMENT'
                    ? 'Tidak ada produk yang menunggu validasi'
                    : 'Tidak ada produk ditemukan'}
                </p>
                <p className="text-sm mt-1">Semua sudah beres! 🎉</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-xs text-slate-500 font-semibold">
                      <th className="p-3">Produk</th>
                      <th className="p-3">Penjual</th>
                      <th className="p-3">Harga</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Bukti Bayar</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {product.media?.[0] ? (
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
                              <p className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                                {product.title}
                              </p>
                              <p className="text-xs text-slate-500">{product.campusName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(product.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          <p className="font-medium text-slate-700">{product.seller?.name}</p>
                          <p className="text-slate-400">{product.seller?.email}</p>
                        </td>
                        <td className="p-3 text-xs font-semibold text-slate-700">
                          {formatRupiah(product.displayPrice)}
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                            Fee: {formatRupiah(product.listingFeePaid ?? 0)}
                          </p>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(product.status)}
                          {product.status === 'REJECTED' && product.rejectionReason && (
                            <p className="text-[10px] text-red-600 mt-1 max-w-[170px] italic leading-tight">
                              Alasan: {product.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          {product.paymentProofUrl ? (
                            <button
                              onClick={() => setPreviewProof(product.paymentProofUrl)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <Eye size={13} />
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/products/${product.id}`, '_blank')}
                              className="h-8 w-8 p-0"
                              title="Lihat Produk"
                            >
                              <ExternalLink size={14} />
                            </Button>

                            {product.status === 'PENDING_PAYMENT' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleValidatePayment(product.id, 'APPROVE')}
                                  disabled={actionLoading === product.id}
                                  className="text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                                >
                                  {actionLoading === product.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={12} />
                                  )}
                                  Setujui
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRejectingProduct(product)
                                    setSelectedPresetReason(PRESET_REASONS[0])
                                    setCustomReason('')
                                  }}
                                  disabled={actionLoading === product.id}
                                  className="text-xs h-8 text-red-700 border-red-300 hover:bg-red-50 gap-1"
                                >
                                  {actionLoading === product.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  Tolak
                                </Button>
                              </>
                            )}

                            {product.status === 'ACTIVE' && (
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
                            )}

                            {product.status === 'BANNED' && (
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

                            {product.status === 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleValidatePayment(product.id, 'APPROVE')}
                                disabled={actionLoading === product.id}
                                className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              >
                                Pulihkan &amp; Setujui
                              </Button>
                            )}
                          </div>
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
