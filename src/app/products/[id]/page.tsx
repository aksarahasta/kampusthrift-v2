'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentBadge } from '@/components/shared/student-badge'
import { HonestyScore } from '@/components/shared/honesty-score'
import { ReviewModal } from '@/components/shared/review-modal'
import {
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  Share2,
  Heart,
  ArrowLeft,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  LockKeyhole,
  Ban
} from 'lucide-react'
import { formatRupiah, generateWhatsAppLink } from '@/lib/utils'
import { ProductCategory, ProductStatus } from '@prisma/client'
import { toast } from 'sonner'

const categoryLabels: Record<ProductCategory, string> = {
  BUKU_KULIAH: 'Buku Kuliah',
  ALAT_KOS_RUMAH_TANGGA: 'Alat Kos & Rumah Tangga',
  ELEKTRONIK: 'Elektronik',
  FASHION: 'Fashion',
  LAIN_LAIN: 'Lain-lain',
}

interface Product {
  id: string
  title: string
  description: string
  category: ProductCategory
  basePrice: number
  displayPrice: number
  isBarter: boolean
  barterTarget?: string | null
  conditionPercentage: number
  campusName: string
  status: ProductStatus
  paymentProofUrl?: string | null
  rejectionReason?: string | null
  createdAt: Date
  seller: {
    id: string
    name: string
    isVerifiedStudent: boolean
    honestyScore: number
    campusName?: string | null
    faculty?: string | null
    phoneWhatsapp: string
  }
  media: Array<{
    id: string
    mediaUrl: string
    mediaType: 'IMAGE' | 'VIDEO'
    isPrimary: boolean
  }>
  codZone: {
    campusName: string
    locationName: string
    description?: string | null
  }
  review?: {
    score: number
    comment: string
    createdAt: Date
    buyer: {
      id: string
      name: string
    }
  } | null
}

export default function ProductDetailPage({
  params
}: {
  params: { id: string }
}) {
  const id = params.id
  const router = useRouter()
  const { data: session } = useSession()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const images = product?.media.filter((m) => m.mediaType === 'IMAGE') || []
  const video = product?.media.find((m) => m.mediaType === 'VIDEO')

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${id}`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || 'Produk tidak ditemukan')
        }

        setProduct(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat produk')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleWhatsAppContact = () => {
    if (!product) return

    // User must be logged in to buy or contact seller via WhatsApp (Req 3)
    if (!session?.user) {
      toast.info('Silakan masuk ke akun Anda terlebih dahulu untuk menghubungi penjual dan bertransaksi.')
      router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${product.id}`)}`)
      return
    }

    const waLink = generateWhatsAppLink(
      product.seller.phoneWhatsapp,
      product.seller.name,
      product.title,
      product.displayPrice,
      product.codZone.locationName
    )

    window.open(waLink, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin motion-reduce:animate-none text-primary" size={32} />
        <p className="text-sm text-muted-foreground mt-2">Memuat detail produk...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-destructive" size={48} />
          <h2 className="text-xl font-bold text-foreground">Produk Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">{error || 'Barang mungkin sudah dihapus atau tidak tersedia.'}</p>
          <Button onClick={() => router.push('/products')} className="w-full">
            Kembali ke Katalog
          </Button>
        </Card>
      </div>
    )
  }

  const isOwner = session?.user?.id === product.seller.id

  return (
    <div className="min-h-screen bg-background pb-[calc(16rem+env(safe-area-inset-bottom))] lg:pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* Top Navigation */}
      <div className="bg-card border-b border-border relative z-10">
        <div className="container mx-auto py-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Kembali
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" aria-label="Bagikan produk" className="h-11 w-11">
              <Share2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Simpan produk" className="h-11 w-11">
              <Heart size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-5 sm:py-8">
        {product.status === ProductStatus.PENDING_PAYMENT && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning flex items-start gap-3">
            <Clock size={22} className="shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">Menunggu Validasi Admin</p>
              <p className="text-xs text-warning mt-0.5">
                Bukti transfer pembayaran listing fee Anda sedang diperiksa oleh admin. Produk ini akan otomatis tampil di katalog setelah disetujui.
              </p>
            </div>
          </div>
        )}
        {product.status === ProductStatus.REJECTED && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3 shadow-sm">
            <AlertCircle size={24} className="shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-2 break-words">
              <div>
                <p className="font-bold text-sm text-destructive">Pembayaran Ditolak oleh Admin</p>
                <div className="mt-1.5 p-2.5 bg-card/90 rounded-lg border border-destructive/30">
                  <p className="text-xs text-muted-foreground font-semibold">Alasan Penolakan dari Admin:</p>
                  <p className="text-xs text-destructive font-medium mt-0.5">
                    {product.rejectionReason || 'Bukti transfer tidak valid atau nominal pembayaran tidak sesuai.'}
                  </p>
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className="h-auto min-h-11 w-full whitespace-normal text-xs bg-destructive hover:bg-destructive/90 text-primary-foreground font-medium sm:w-auto"
                  >
                    Edit &amp; Upload Ulang Bukti Pembayaran
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-8">
          {/* Media Gallery Section */}
          <div className="min-w-0 space-y-4">
            {/* Main Media Display */}
            <div className="relative aspect-square bg-muted rounded-xl overflow-hidden border border-border">
              {showVideo && video ? (
                <video
                  src={video.mediaUrl}
                  controls
                  playsInline
                  poster={images[0]?.mediaUrl}
                  className="w-full h-full object-contain"
                />
              ) : images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[currentImageIndex]?.mediaUrl}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Tidak ada gambar
                </div>
              )}

              {/* Navigation Arrows */}
              {!showVideo && images.length > 1 && (
                <>
                  <button
                    aria-label="Foto sebelumnya"
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center bg-card/80 hover:bg-card rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    aria-label="Foto berikutnya"
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center bg-card/80 hover:bg-card rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Video Badge */}
              {video && !showVideo && (
                <button
                  aria-label="Lihat video bukti kondisi"
                  aria-pressed={showVideo}
                  onClick={() => setShowVideo(true)}
                  className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium flex min-h-11 min-w-0 items-center gap-1.5 whitespace-nowrap hover:bg-primary/90 transition-colors"
                >
                  <PlayCircle size={14} />
                  Lihat Video Bukti
                </button>
              )}

              {/* Status Overlay */}
              {product.status !== ProductStatus.ACTIVE && (
                <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center p-4">
                  <Badge
                    variant={
                      product.status === ProductStatus.PENDING_PAYMENT
                        ? 'outline'
                        : 'destructive'
                    }
                    className={`max-w-full whitespace-normal text-center text-sm px-4 py-2 ${
                      product.status === ProductStatus.PENDING_PAYMENT
                        ? 'bg-card text-warning border-warning/30'
                        : ''
                    }`}
                  >
                    {product.status === ProductStatus.SOLD ? <CheckCircle2 size={16} className="mr-2 shrink-0" />
                      : product.status === ProductStatus.RESERVED ? <LockKeyhole size={16} className="mr-2 shrink-0" />
                      : product.status === ProductStatus.PENDING_PAYMENT ? <Clock size={16} className="mr-2 shrink-0" />
                      : product.status === ProductStatus.REJECTED ? <AlertCircle size={16} className="mr-2 shrink-0" />
                      : <Ban size={16} className="mr-2 shrink-0" />}
                    {product.status === ProductStatus.SOLD
                      ? 'Terjual'
                      : product.status === ProductStatus.RESERVED
                        ? 'Dipesan'
                        : product.status === ProductStatus.PENDING_PAYMENT
                          ? 'Menunggu Validasi Pembayaran'
                          : product.status === ProductStatus.REJECTED
                            ? 'Pembayaran Ditolak'
                            : 'Tidak Tersedia'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {video && (
                <button
                  aria-label="Lihat video bukti kondisi"
                  aria-pressed={showVideo}
                  onClick={() => setShowVideo(true)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    showVideo ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <PlayCircle className="text-primary" size={20} />
                  </div>
                </button>
              )}
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  aria-label={`Lihat foto ${idx + 1}`}
                  aria-pressed={!showVideo && currentImageIndex === idx}
                  onClick={() => {
                    setShowVideo(false)
                    setCurrentImageIndex(idx)
                  }}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    !showVideo && currentImageIndex === idx ? 'border-primary' : 'border-border'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.mediaUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="min-w-0 space-y-4">
            {/* Header */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{categoryLabels[product.category]}</Badge>
                  {product.isBarter && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <RefreshCw size={12} />
                      Terima Barter
                    </Badge>
                  )}
                  {product.seller.isVerifiedStudent && <StudentBadge size="sm" />}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  {product.title}
                </h1>

                <div className="break-words text-2xl sm:text-3xl font-bold text-primary">
                  {formatRupiah(product.displayPrice)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span>{product.campusName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-muted-foreground" />
                    <span>{new Date(product.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => router.push(`/users/${product.seller.id}`)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User size={16} />
                  Informasi Penjual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                      {product.seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 break-words">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground">{product.seller.name}</span>
                        {product.seller.isVerifiedStudent && <StudentBadge size="sm" showText={false} />}
                      </div>
                      {product.seller.campusName && (
                        <p className="text-xs text-muted-foreground">{product.seller.campusName}</p>
                      )}
                    </div>
                  </div>
                  <HonestyScore
                    score={product.seller.honestyScore}
                    size="md"
                    showCount={true}
                  />
                </div>
                <p className="text-xs text-primary text-right">Lihat Profil</p>
              </CardContent>
            </Card>

            {/* Condition & Barter Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Kondisi Fisik</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${product.conditionPercentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-success">{product.conditionPercentage}%</span>
                  </div>
                </div>

                {product.isBarter && product.barterTarget && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-xs font-medium text-primary mb-1">Target Barter:</p>
                    <p className="text-sm text-primary">{product.barterTarget}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="break-words text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            {/* COD Zone */}
            <Card className="bg-success/10 border-success/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-success shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-success text-sm">COD Safe Zone</h4>
                    <p className="text-success text-sm mt-0.5">
                      {product.codZone.locationName}, {product.codZone.campusName}
                    </p>
                    {product.codZone.description && (
                      <p className="text-xs text-success mt-1">
                        {product.codZone.description}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs border-success/30 text-success">
                      Rp 0 Ongkir
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop WhatsApp Action Button */}
            {product.status === ProductStatus.ACTIVE && !isOwner && (
              <Button
                onClick={handleWhatsAppContact}
                size="lg"
                className="hidden lg:flex w-full h-auto min-h-12 whitespace-normal py-3 text-base font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <MessageCircle size={22} />
                {session?.user ? 'Hubungi Penjual via WhatsApp' : 'Masuk untuk Transaksi via WA'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      {product.status === ProductStatus.ACTIVE && !isOwner && (
        <div className="product-action-bar fixed left-0 right-0 bg-card border-t border-border shadow-lg z-40 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Harga Total</p>
              <p className="text-xl font-bold text-primary">
                {formatRupiah(product.displayPrice)}
              </p>
            </div>
            <Button
              onClick={handleWhatsAppContact}
              className="min-w-0 flex-1 h-auto min-h-12 whitespace-normal py-3 text-sm sm:text-base gap-2 bg-primary hover:bg-primary/90"
            >
              <MessageCircle size={18} />
              {session?.user ? 'Hubungi via WhatsApp' : 'Masuk untuk Chat WA'}
            </Button>
          </div>
        </div>
      )}

      {/* Buyer Review Action if SOLD and no review yet */}
      {product.status === ProductStatus.SOLD && !isOwner && !product.review && (
        <div className="product-action-bar fixed left-0 right-0 bg-card border-t border-border shadow-lg z-40 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Barang ini sudah terjual</p>
              <p className="text-xs text-muted-foreground">Apakah Anda pembelinya? Berikan ulasan untuk membantu penjual</p>
            </div>
            <Button
              onClick={() => setShowReviewModal(true)}
              className="h-auto min-h-11 whitespace-normal py-2 text-sm gap-2 bg-primary hover:bg-primary/90"
            >
              <Star size={16} />
              Beri Ulasan
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Beri rating transaksi">
          <ReviewModal
            productId={product.id}
            productTitle={product.title}
            sellerName={product.seller.name}
            onClose={() => setShowReviewModal(false)}
            onSuccess={() => {
              setShowReviewModal(false)
              router.refresh()
            }}
          />
        </Modal>
      )}

      {/* Owner Actions */}
      {isOwner && (
        <div className="product-action-bar fixed left-0 right-0 bg-card border-t border-border shadow-lg z-40 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="min-w-0 flex-1 h-auto min-h-12 whitespace-normal px-3 py-2 text-sm"
              onClick={() => router.push(`/products/${product.id}/edit`)}
            >
              Edit Listing
            </Button>
            <Button
              variant="destructive"
              className="min-w-0 flex-1 h-auto min-h-12 whitespace-normal px-3 py-2 text-sm"
              onClick={async () => {
                if (confirm('Tandai barang ini sebagai TERJUAL?')) {
                  await fetch(`/api/products/${product.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'SOLD' }),
                  })
                  router.refresh()
                }
              }}
            >
              <CheckCircle2 size={16} className="mr-2" />
              Tandai Terjual
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
