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
        return <Badge className="text-xs bg-warning/10 text-warning border-border">Menunggu Validasi</Badge>
      case 'ACTIVE':
        return <Badge className="text-xs bg-success/10 text-success border-border">Aktif</Badge>
      case 'SOLD':
        return <Badge variant="secondary" className="text-xs">Terjual</Badge>
      case 'BANNED':
        return <Badge variant="destructive" className="text-xs">Banned</Badge>
      case 'REJECTED':
        return <Badge className="text-xs bg-destructive/10 text-destructive border-border">Ditolak</Badge>
      default:
        return <Badge className="text-xs">{st}</Badge>
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="min-w-0 max-w-md w-full p-6 text-center">
          <AlertCircle className="mx-auto text-destructive mb-2" size={40} />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <Button onClick={() => router.push('/')} className="min-h-11 mt-4 w-full">
            Kembali
          </Button>
        </Card>
      </div>
    )
  }

  const pendingCount = products.filter((p) => p.status === 'PENDING_PAYMENT').length

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10">
      {/* Proof Preview Modal */}
      {previewProof && (
        <div
          className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewProof(null)}
        >
          <div className="relative max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewProof(null)}
              aria-label="Tutup bukti pembayaran"
              className="sticky top-0 ml-auto mb-2 flex h-11 w-11 items-center justify-center bg-background rounded-md hover:bg-muted z-10"
            >
              <X size={18} className="text-foreground" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewProof}
              alt="Bukti Pembayaran"
              className="w-full rounded-xl shadow-2xl"
            />
            <p className="text-center text-muted-foreground text-sm mt-3">Klik di luar untuk menutup</p>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingProduct && (
        <div
          className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4"
          onClick={() => setRejectingProduct(null)}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 break-words"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2 text-destructive font-bold text-base">
                <XCircle size={20} />
                Tolak Bukti Pembayaran
              </div>
              <button
                onClick={() => setRejectingProduct(null)}
                aria-label="Tutup alasan penolakan"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Produk yang ditolak:</p>
              <p className="font-semibold text-sm text-foreground line-clamp-1">
                {rejectingProduct.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Penjual: {rejectingProduct.seller?.name} ({rejectingProduct.seller?.email})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Pilih Alasan Penolakan:
              </label>
              <div className="space-y-2">
                {PRESET_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-2 min-h-11 p-3 rounded-md border text-sm cursor-pointer transition-colors ${
                      selectedPresetReason === reason
                        ? 'border-border bg-destructive/10 text-destructive font-medium'
                        : 'border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <input
                      type="radio"
                      name="presetReason"
                      value={reason}
                      checked={selectedPresetReason === reason}
                      onChange={(e) => setSelectedPresetReason(e.target.value)}
                      className="mt-0.5 text-destructive"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedPresetReason === 'Lainnya' && (
              <div className="min-w-0 space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Tuliskan Alasan Khusus:
                </label>
                <Input
                  placeholder="Contoh: Bukti buram, mohon upload ulang..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="min-h-11 text-base sm:text-sm text-xs"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingProduct(null)}
                disabled={actionLoading === rejectingProduct.id}
                className="min-h-11 min-w-0 flex-1 text-sm"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectingProduct.id}
                className="min-h-11 min-w-0 flex-1 whitespace-normal text-sm gap-2"
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

      <div className="container min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="min-h-11 h-auto justify-start whitespace-normal gap-2 text-muted-foreground"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard Admin
          </Button>
        </div>

        <Card className="min-w-0 shadow-sm border-border">
          <CardHeader className="min-w-0 p-4 sm:p-6">
            <div className="min-w-0 space-y-4">
              <div>
                <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="text-primary" size={24} />
                  Moderasi Produk
                </CardTitle>
                <CardDescription className="break-words">
                  Validasi bukti bayar listing fee &amp; kelola postingan produk
                </CardDescription>
              </div>

              {/* Status Filters */}
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
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
                    aria-pressed={statusFilter === key}
                    className={`min-h-11 shrink-0 text-sm h-11 ${key === 'PENDING_PAYMENT' && statusFilter !== key ? 'border-border text-warning' : ''}`}
                  >
                    {key === 'PENDING_PAYMENT' && <Clock size={12} className="mr-1" />}
                    {label}
                    {key === 'PENDING_PAYMENT' && pendingCount > 0 && statusFilter === 'PENDING_PAYMENT' && (
                      <span className="ml-1 bg-warning/10 text-warning text-xs rounded-full px-1.5 py-px">
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
              className="flex min-w-0 gap-2 mt-4"
            >
              <Input
                placeholder="Cari produk atau penjual..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 text-base sm:text-sm text-sm"
              />
              <Button type="submit" variant="outline" size="sm" className="min-h-11 gap-1 shrink-0">
                <Search size={14} />
                Cari
              </Button>
            </form>
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {statusFilter === 'PENDING_PAYMENT'
                    ? 'Tidak ada produk yang menunggu validasi'
                    : 'Tidak ada produk ditemukan'}
                </p>
                <p className="text-sm mt-1">Semua sudah beres!</p>
              </div>
            ) : (
              <div className="max-w-full min-w-0 overflow-x-auto">
                <table className="block w-full text-left text-sm md:table md:min-w-[960px]">
                  <thead className="hidden md:table-header-group bg-muted border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground font-semibold">
                      <th className="p-3">Produk</th>
                      <th className="p-3">Penjual</th>
                      <th className="p-3">Harga</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Bukti Bayar</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-border md:table-row-group">
                    {products.map((product) => (
                      <tr key={product.id} className="block min-w-0 py-3 md:table-row md:py-0 hover:bg-muted/50">
                        <td data-label="Produk" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3">
                          <div className="flex items-center gap-3">
                            {product.media?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.media[0].mediaUrl}
                                alt={product.title}
                                className="w-12 h-12 shrink-0 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 shrink-0 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                No img
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground break-words md:max-w-[180px]">
                                {product.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{product.campusName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(product.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Penjual" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 text-xs">
                          <p className="font-medium text-foreground">{product.seller?.name}</p>
                          <p className="text-muted-foreground">{product.seller?.email}</p>
                        </td>
                        <td data-label="Harga" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 text-xs font-semibold text-foreground">
                          {formatRupiah(product.displayPrice)}
                          <p className="text-xs text-muted-foreground font-normal mt-0.5">
                            Fee: {formatRupiah(product.listingFeePaid ?? 0)}
                          </p>
                        </td>
                        <td data-label="Status" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3">
                          {getStatusBadge(product.status)}
                          {product.status === 'REJECTED' && product.rejectionReason && (
                            <p className="text-xs text-destructive mt-1 max-w-[170px] italic leading-tight">
                              Alasan: {product.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td data-label="Bukti bayar" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3">
                          {product.paymentProofUrl ? (
                            <button
                              onClick={() => setPreviewProof(product.paymentProofUrl)}
                              className="flex min-h-11 items-center gap-2 text-sm text-primary hover:text-primary hover:underline"
                            >
                              <Eye size={13} />
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Tidak ada</span>
                          )}
                        </td>
                        <td data-label="Aksi" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 md:text-right">
                          <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/products/${product.id}`, '_blank')}
                              className="min-h-11 h-11 w-11 shrink-0 p-0"
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
                                  className="min-h-11 text-sm h-11 text-success border-border hover:bg-success/10 gap-1"
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
                                  className="min-h-11 text-sm h-11 text-destructive border-border hover:bg-destructive/10 gap-1"
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
                                className="min-h-11 text-sm h-11"
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
                                className="min-h-11 text-sm h-11 text-success border-border hover:bg-success/10"
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
                                className="min-h-11 text-sm h-11 text-success border-border hover:bg-success/10"
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
