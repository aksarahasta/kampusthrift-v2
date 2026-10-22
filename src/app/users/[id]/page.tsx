'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/cards/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentBadge } from '@/components/shared/student-badge'
import { HonestyScore } from '@/components/shared/honesty-score'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ShoppingBag,
  Star,
  MessageCircle,
  Loader2,
  User
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string
  campusName?: string | null
  faculty?: string | null
  avatarUrl?: string | null
  isVerifiedStudent: boolean
  honestyScore: number
  createdAt: string
  _count: {
    products: number
    reviewsReceived: number
  }
  soldCount: number
  activeProducts: any[]
}

interface Review {
  id: string
  score: number
  comment: string
  createdAt: string
  buyer: {
    id: string
    name: string
    avatarUrl?: string | null
    campusName?: string | null
  }
  product: {
    id: string
    title: string
    displayPrice: number
  }
}

export default function UserProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const router = useRouter()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch user profile
        const userRes = await fetch(`/api/users/${id}`)
        const userJson = await userRes.json()
        if (userRes.ok) {
          setUser(userJson.data)
        }

        // Fetch reviews
        const reviewsRes = await fetch(`/api/users/${id}/reviews`)
        const reviewsJson = await reviewsRes.json()
        if (reviewsRes.ok) {
          setReviews(reviewsJson.data || [])
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm text-slate-500 mt-2">Memuat profil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <User className="mx-auto text-slate-400" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Pengguna Tidak Ditemukan</h2>
          <Button onClick={() => router.push('/products')} className="w-full">
            Kembali ke Katalog
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Kembali
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-24" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-10">
              {/* Avatar */}
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-blue-600 font-bold text-2xl">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                  {user.isVerifiedStudent && <StudentBadge />}
                </div>
                {user.campusName && (
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                    <MapPin size={14} />
                    {user.campusName}
                    {user.faculty && <span className="text-slate-400">• {user.faculty}</span>}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <HonestyScore score={user.honestyScore} size="md" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{user.soldCount}</div>
                <div className="text-xs text-slate-500">Terjual</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{user._count.products}</div>
                <div className="text-xs text-slate-500">Barang Aktif</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-500">{user._count.reviewsReceived}</div>
                <div className="text-xs text-slate-500">Ulasan</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 mt-4">
              <Calendar size={12} />
              Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b bg-white rounded-t-lg px-4 pt-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag size={16} />
            Barang Dijual ({user.activeProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageCircle size={16} />
            Ulasan ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg border border-t-0 p-4">
          {activeTab === 'products' ? (
            user.activeProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingBag className="mx-auto mb-2 text-slate-300" size={40} />
                <p>Belum ada barang aktif dijual</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {user.activeProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Star className="mx-auto mb-2 text-slate-300" size={40} />
                  <p>Belum ada ulasan</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm">
                            {review.buyer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-800">
                                {review.buyer.name}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    className={
                                      i < review.score
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{review.comment}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              {new Date(review.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' • '}
                              {review.product.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
