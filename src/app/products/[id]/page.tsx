'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
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
  User
} from 'lucide-react'
import { formatRupiah, generateWhatsAppLink } from '@/lib/utils'
import { ProductCategory, ProductStatus } from '@prisma/client'

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
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm text-slate-500 mt-2">Memuat detail produk...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Produk Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600">{error || 'Barang mungkin sudah dihapus atau tidak tersedia.'}</p>
          <Button onClick={() => router.push('/products')} className="w-full">
            Kembali ke Katalog
          </Button>
        </Card>
      </div>
    )
  }

  const isOwner = session?.user?.id === product.seller.id

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Media Gallery Section */}
          <div className="space-y-4">
            {/* Main Media Display */}
            <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border">
              {showVideo && video ? (
                <video
                  src={video.mediaUrl}
                  controls
                  autoPlay
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
                <div className="flex items-center justify-center h-full text-slate-400">
                  Tidak ada gambar
                </div>
              )}

              {/* Navigation Arrows */}
              {!showVideo && images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Video Badge */}
              {video && !showVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute bottom-3 right-3 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-purple-700 transition-colors"
                >
                  <PlayCircle size={14} />
                  Lihat Video Bukti
                </button>
              )}

              {/* Status Overlay */}
              {product.status !== ProductStatus.ACTIVE && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-base px-4 py-2">
                    {product.status === ProductStatus.SOLD
                      ? '✓ Terjual'
                      : product.status === ProductStatus.RESERVED
                        ? '🔒 Dipesan'
                        : '🚫 Tidak Tersedia'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {video && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    showVideo ? 'border-purple-600' : 'border-slate-200'
                  }`}
                >
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                    <PlayCircle className="text-purple-600" size={20} />
                  </div>
                </button>
              )}
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setShowVideo(false)
                    setCurrentImageIndex(idx)
                  }}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    !showVideo && currentImageIndex === idx ? 'border-blue-600' : 'border-slate-200'
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
          <div className="space-y-4">
            {/* Header */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{categoryLabels[product.category]}</Badge>
                  {product.isBarter && (
                    <Badge className="bg-purple-600 text-white gap-1">
                      <RefreshCw size={12} />
                      Terima Barter
                    </Badge>
                  )}
                  {product.seller.isVerifiedStudent && <StudentBadge size="sm" />}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {product.title}
                </h1>

                <div className="text-3xl font-bold text-blue-600">
                  {formatRupiah(product.displayPrice)}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{product.campusName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-400" />
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
            <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push(`/users/${product.seller.id}`)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={16} />
                  Informasi Penjual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {product.seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{product.seller.name}</span>
                        {product.seller.isVerifiedStudent && <StudentBadge size="sm" showText={false} />}
                      </div>
                      {product.seller.campusName && (
                        <p className="text-xs text-slate-500">{product.seller.campusName}</p>
                      )}
                    </div>
                  </div>
                  <HonestyScore
                    score={product.seller.honestyScore}
                    size="md"
                    showCount={true}
                  />
                </div>
                <p className="text-xs text-blue-600 text-right">Lihat Profil →</p>
              </CardContent>
            </Card>

            {/* Condition & Barter Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Kondisi Fisik</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${product.conditionPercentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-emerald-600">{product.conditionPercentage}%</span>
                  </div>
                </div>

                {product.isBarter && product.barterTarget && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs font-medium text-purple-900 mb-1">Target Barter:</p>
                    <p className="text-sm text-purple-800">{product.barterTarget}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            {/* COD Zone */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">COD Safe Zone</h4>
                    <p className="text-emerald-800 text-sm mt-0.5">
                      {product.codZone.locationName}, {product.codZone.campusName}
                    </p>
                    {product.codZone.description && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {product.codZone.description}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs border-emerald-300 text-emerald-700">
                      Rp 0 Ongkir
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      {product.status === ProductStatus.ACTIVE && !isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
          <div className="container mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500">Harga Total</p>
              <p className="text-xl font-bold text-blue-600">
                {formatRupiah(product.displayPrice)}
              </p>
            </div>
            <Button
              onClick={handleWhatsAppContact}
              className="flex-1 h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle size={18} />
              Hubungi via WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Buyer Review Action if SOLD and no review yet */}
      {product.status === ProductStatus.SOLD && !isOwner && !product.review && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Barang ini sudah terjual</p>
              <p className="text-xs text-slate-500">Apakah Anda pembelinya? Berikan ulasan untuk membantu penjual</p>
            </div>
            <Button
              onClick={() => setShowReviewModal(true)}
              className="h-10 text-sm gap-2 bg-amber-500 hover:bg-amber-600"
            >
              <Star size={16} />
              Beri Ulasan
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
        </div>
      )}

      {/* Owner Actions */}
      {isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
          <div className="container mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => router.push(`/products/${product.id}/edit`)}
            >
              Edit Listing
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12"
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
