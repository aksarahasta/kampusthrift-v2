'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ProductCard } from '@/components/cards/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  User,
  Edit3,
  Phone,
  GraduationCap,
  CheckCircle2,
  X,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  name: string
  email: string
  phoneWhatsapp?: string | null
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
  const { data: session, update: updateSession } = useSession()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products')

  // Edit Profile Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCampus, setEditCampus] = useState('')
  const [editFaculty, setEditFaculty] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploadedUrl, setAvatarUploadedUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const isOwner = session?.user?.id === id || session?.user?.role === 'ADMIN'

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch user profile
        const userRes = await fetch(`/api/users/${id}`)
        const userJson = await userRes.json()
        if (userRes.ok) {
          setUser(userJson.data)
          setEditName(userJson.data.name || '')
          setEditPhone(userJson.data.phoneWhatsapp || '')
          setEditCampus(userJson.data.campusName || '')
          setEditFaculty(userJson.data.faculty || '')
          setAvatarPreview(userJson.data.avatarUrl || null)
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

  /** Handle avatar file selection: preview immediately, then upload to Supabase */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'Gagal upload foto')

      setAvatarUploadedUrl(json.data.mediaUrl)
      toast.success('Foto profil berhasil diunggah!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload foto profil')
      // Revert preview on failure
      setAvatarPreview(user?.avatarUrl || null)
      setAvatarUploadedUrl(null)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phoneWhatsapp: editPhone.trim(),
          campusName: editCampus.trim(),
          faculty: editFaculty.trim(),
          // Include uploaded avatar URL if one was just uploaded
          avatarUrl: avatarUploadedUrl ?? user?.avatarUrl ?? null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memperbarui profil')
      }

      const finalAvatarUrl = avatarUploadedUrl ?? user?.avatarUrl ?? null

      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              phoneWhatsapp: editPhone.trim(),
              campusName: editCampus.trim(),
              faculty: editFaculty.trim(),
              avatarUrl: finalAvatarUrl,
            }
          : null
      )

      // Keep preview in sync with the saved avatar
      setAvatarPreview(finalAvatarUrl)
      setAvatarUploadedUrl(null)

      if (updateSession) {
        await updateSession({ name: editName.trim() })
      }

      toast.success('Profil berhasil diperbarui!')
      setIsEditOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingProfile(false)
    }
  }

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

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Edit3 size={14} />
              Edit Profil
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-24" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-10">
              {/* Avatar */}
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-blue-600 font-bold text-2xl overflow-hidden shrink-0">
                {(avatarPreview || user.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview || user.avatarUrl!}
                    alt={user.name}
                    className="w-full h-full object-cover"
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
                {isOwner && user.phoneWhatsapp && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} className="text-emerald-600" />
                    WhatsApp: {user.phoneWhatsapp}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <HonestyScore score={user.honestyScore} size="md" />
                {isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditOpen(true)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Edit3 size={13} />
                    Edit Profil Saya
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{user.soldCount}</div>
                <div className="text-xs text-slate-500">Terjual</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {user.activeProducts?.length || 0}
                </div>
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
            Barang Dijual ({user.activeProducts?.length || 0})
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
            !user.activeProducts || user.activeProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingBag className="mx-auto mb-2 text-slate-300" size={40} />
                <p>Belum ada barang aktif dijual</p>
                {isOwner && (
                  <Button
                    size="sm"
                    onClick={() => router.push('/products/new')}
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    + Jual Barang Sekarang
                  </Button>
                )}
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
                            {review.buyer?.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-800">
                                {review.buyer?.name || 'Pembeli'}
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
                              {review.product?.title && ` • ${review.product.title}`}
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

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" />
                Edit Profil Akun
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-1 pb-2">
                <label className="cursor-pointer relative block w-20 h-20" title="Ketuk untuk ganti foto profil">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Preview avatar" className="w-full h-full object-cover" />
                    ) : (
                      editName.charAt(0).toUpperCase() || <User size={32} />
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {uploadingAvatar
                      ? <Loader2 className="animate-spin text-white" size={22} />
                      : <Camera className="text-white" size={22} />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar || savingProfile}
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  {uploadingAvatar ? 'Mengunggah foto...' : 'Ketuk untuk ganti foto profil'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-xs font-semibold text-slate-700">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editPhone" className="text-xs font-semibold text-slate-700">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="editPhone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Nomor ini digunakan pembeli untuk menghubungi Anda via pesan otomatis WA saat janjian COD.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCampus" className="text-xs font-semibold text-slate-700">
                  Asal Kampus
                </Label>
                <Input
                  id="editCampus"
                  value={editCampus}
                  onChange={(e) => setEditCampus(e.target.value)}
                  placeholder="cth. Universitas Negeri Semarang (UNNES)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editFaculty" className="text-xs font-semibold text-slate-700">
                  Fakultas / Jurusan
                </Label>
                <Input
                  id="editFaculty"
                  value={editFaculty}
                  onChange={(e) => setEditFaculty(e.target.value)}
                  placeholder="cth. Fakultas Teknik / Ilmu Komputer"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1"
                  disabled={savingProfile}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Simpan Profil
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
