import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

import { StudentBadge } from '@/components/shared/student-badge'
import { HonestyScore } from '@/components/shared/honesty-score'
import { MapPin, RefreshCw, Clock, Video, ImageIcon } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { ProductCategory, ProductStatus } from '@prisma/client'

interface ProductCardProps {
  priority?: boolean
  product: {
    id: string
    title: string
    displayPrice: number
    isBarter: boolean
    barterTarget?: string | null
    conditionPercentage: number
    category: ProductCategory
    status: ProductStatus
    campusName: string
    createdAt: Date
    seller: {
      id: string
      name: string
      isVerifiedStudent: boolean
      honestyScore: number
      campusName?: string | null
    }
    media: Array<{
      mediaUrl: string
      mediaType: 'IMAGE' | 'VIDEO'
      isPrimary: boolean
    }>
    codZone?: {
      campusName: string
      locationName: string
    }
  }
}

const categoryLabels: Record<ProductCategory, string> = {
  BUKU_KULIAH: 'Buku Kuliah',
  ALAT_KOS_RUMAH_TANGGA: 'Alat Kos & RT',
  ELEKTRONIK: 'Elektronik',
  FASHION: 'Fashion',
  LAIN_LAIN: 'Lain-lain',
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const mediaList = product.media || []
  const primaryImage = mediaList.find((m) => m.isPrimary && m.mediaType === 'IMAGE') || mediaList.find((m) => m.mediaType === 'IMAGE')
  const hasVideo = mediaList.some((m) => m.mediaType === 'VIDEO')
  const seller = product.seller || { name: 'Penjual', isVerifiedStudent: false, honestyScore: 0 }

  return (
    <Link href={`/products/${product.id}`} className="product-link">
      <article className="product-tile">
        {/* Image Container */}
        <div className="product-media">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.mediaUrl}
              alt={product.title}
              className="object-cover w-full h-full"
                            width={480}
                            height={480}
                            loading={priority ? 'eager' : 'lazy'}
                                          fetchPriority={priority ? 'high' : undefined}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
              <ImageIcon size={24} aria-hidden="true" />
              <span className="text-xs">Tidak ada gambar</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBarter && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs gap-1">
                <RefreshCw size={12} aria-hidden="true" />
                Barter
              </Badge>
            )}
            {hasVideo && (
              <Badge variant="secondary" className="gap-1 bg-foreground text-background text-xs">
                <Video size={12} aria-hidden="true" /> Ada Video
              </Badge>
            )}
            {seller.isVerifiedStudent && (
              <StudentBadge size="sm" showText={false} className="bg-primary" />
            )}
          </div>

          {/* Status Badge */}
          {product.status !== 'ACTIVE' && (
            <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center p-2 text-center">
              <Badge
                variant={product.status === 'PENDING_PAYMENT' ? 'outline' : 'destructive'}
                className={`text-xs font-semibold px-2.5 py-1 ${
                  product.status === 'PENDING_PAYMENT'
                    ? 'bg-warning text-primary-foreground border-transparent'
                    : product.status === 'REJECTED'
                    ? 'bg-destructive text-destructive-foreground border-transparent'
                    : ''
                }`}
              >
                {product.status === 'SOLD'
                  ? 'Terjual'
                  : product.status === 'RESERVED'
                  ? 'Dipesan'
                  : product.status === 'PENDING_PAYMENT'
                  ? 'Sedang Direview'
                  : product.status === 'REJECTED'
                  ? 'Ditolak Admin'
                  : 'Tidak Tersedia'}
              </Badge>
            </div>
          )}
        </div>

        <div className="product-info">
          {/* Title & Price */}
          <div>
            <h3 className="line-clamp-2">
              {product.title}
            </h3>
            <p className="product-price mt-1">
              {formatRupiah(product.displayPrice)}
            </p>
          </div>

          {/* Category & Condition */}
          <div className="product-meta">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[product.category]}
            </Badge>
            <span>
              Kondisi {product.conditionPercentage}%
            </span>
          </div>

          {/* Seller Info */}
          <div className="product-seller">
            <div className="flex min-w-0 items-center gap-1">
              <span className="max-w-[130px] truncate text-xs text-muted-foreground">
                {seller.name}
              </span>
              {seller.isVerifiedStudent && (
                <StudentBadge size="sm" showText={false} />
              )}
            </div>
            <HonestyScore
              score={seller.honestyScore || 0}
              size="sm"
              showCount={false}
            />
          </div>

          {/* Location & Time */}
          <div className="product-meta justify-between">
            <div className="product-location">
              <MapPin size={12} className="shrink-0" aria-hidden="true" />
              <span className="truncate" title={product.campusName}>{product.campusName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              <time dateTime={new Date(product.createdAt).toISOString()}>{new Date(product.createdAt).toLocaleDateString('id-ID')}</time>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
