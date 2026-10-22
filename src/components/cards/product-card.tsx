import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StudentBadge } from '@/components/shared/student-badge'
import { HonestyScore } from '@/components/shared/honesty-score'
import { MapPin, RefreshCw, Clock } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { ProductCategory, ProductStatus } from '@prisma/client'

interface ProductCardProps {
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

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.media.find((m) => m.isPrimary && m.mediaType === 'IMAGE') || product.media.find((m) => m.mediaType === 'IMAGE')
  const hasVideo = product.media.some((m) => m.mediaType === 'VIDEO')

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 h-full">
        {/* Image Container */}
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.mediaUrl}
              alt={product.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <span className="text-sm">Tidak ada gambar</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBarter && (
              <Badge variant="secondary" className="bg-purple-600 text-white text-[10px] gap-1">
                <RefreshCw size={10} />
                Barter
              </Badge>
            )}
            {hasVideo && (
              <Badge variant="secondary" className="bg-slate-800 text-white text-[10px]">
                📹 Ada Video
              </Badge>
            )}
            {product.seller.isVerifiedStudent && (
              <StudentBadge size="sm" showText={false} className="bg-blue-600" />
            )}
          </div>

          {/* Status Badge */}
          {product.status !== 'ACTIVE' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                {product.status === 'SOLD' ? 'Terjual' : product.status === 'RESERVED' ? 'Dipesan' : 'Tidak Tersedia'}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Title & Price */}
          <div>
            <h3 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight">
              {product.title}
            </h3>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formatRupiah(product.displayPrice)}
            </p>
          </div>

          {/* Category & Condition */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px]">
              {categoryLabels[product.category]}
            </Badge>
            <span className="text-slate-500">
              Kondisi {product.conditionPercentage}%
            </span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 truncate max-w-[100px]">
                {product.seller.name}
              </span>
              {product.seller.isVerifiedStudent && (
                <StudentBadge size="sm" showText={false} />
              )}
            </div>
            <HonestyScore
              score={product.seller.honestyScore}
              size="sm"
              showCount={false}
            />
          </div>

          {/* Location & Time */}
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin size={10} />
              <span className="truncate max-w-[120px]">{product.campusName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{new Date(product.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
