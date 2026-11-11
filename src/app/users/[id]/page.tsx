'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ProductCard } from '@/components/cards/product-card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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
  Camera,
  Clock,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadMediaDirect } from '@/lib/upload'

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
  allProducts?: any[]
  productCounts?: {
    total: number
    active: number
    pending: number
    rejected: number
    sold: number
  }
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
  const [productStatusFilter, setProductStatusFilter] = useState<string>('ALL')

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
      const uploadedUrl = await uploadMediaDirect(file, 'IMAGE')
      setAvatarUploadedUrl(uploadedUrl)
      toast.success('Foto profil berhasil diunggah!')
    } catch (err) {
      console.error('Upload avatar error:', err)
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
        await updateSession({
          name: editName.trim(),
          avatarUrl: finalAvatarUrl,
        })
      }

      // Notify other components like Navbar about the new profile data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile-updated', {
            detail: {
              avatarUrl: finalAvatarUrl,
              name: editName.trim(),
            },
          })
        )
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
        <Loader2 className="animate-spin motion-reduce:animate-none text-primary" size={32} />
        <p className="text-sm text-muted-foreground mt-2">Memuat profil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <User className="mx-auto text-muted-foreground" size={48} />
          <h2 className="text-xl font-bold text-foreground">Pengguna Tidak Ditemukan</h2>
          <Button onClick={() => router.push('/products')} className="w-full">
            Kembali ke Katalog
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Edit3 size={14} />
              Edit Profil
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/15 h-24" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-10">
              {/* Avatar */}
              <div className="w-20 h-20 bg-card rounded-full border-4 border-card shadow-lg flex items-center justify-center text-primary font-bold text-2xl overflow-hidden shrink-0">
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

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
                  {user.isVerifiedStudent && <StudentBadge />}
                </div>
                {user.campusName && (
                  <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    <MapPin size={14} />
                    {user.campusName}
                    {user.faculty && <span className="text-muted-foreground">{user.faculty}</span>}
                  </p>
                )}
                {isOwner && user.phoneWhatsapp && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone size={12} className="text-success" />
                    WhatsApp: {user.phoneWhatsapp}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
              <div className="min-w-0 text-center p-2 sm:p-3 bg-muted rounded-lg">
                <div className="break-words text-xl sm:text-2xl font-bold text-primary">{user.soldCount}</div>
                <div className="text-xs text-muted-foreground">Terjual</div>
              </div>
              <div className="min-w-0 text-center p-2 sm:p-3 bg-muted rounded-lg">
                <div className="break-words text-xl sm:text-2xl font-bold text-success">
                  {user.activeProducts?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Barang Aktif</div>
              </div>
              <div className="min-w-0 text-center p-2 sm:p-3 bg-muted rounded-lg">
                <div className="break-words text-xl sm:text-2xl font-bold text-warning">{user._count.reviewsReceived}</div>
                <div className="text-xs text-muted-foreground">Ulasan</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
              <Calendar size={12} />
              Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-border bg-card rounded-t-lg px-2 sm:px-4 pt-3 sm:pt-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex min-w-0 flex-wrap items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag size={16} />
            {isOwner ? 'Daftar Listing Saya' : 'Barang Dijual'} (
            {isOwner
              ? user.allProducts?.length ?? user.activeProducts?.length ?? 0
              : user.activeProducts?.length ?? 0}
            )
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex min-w-0 flex-wrap items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle size={16} />
            Ulasan ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-b-lg border border-t-0 p-4 space-y-4">
          {activeTab === 'products' ? (
            <>
              {/* Status Filter Pills for Seller / Owner */}
              {isOwner && (
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Status:</span>
                  {[
                    { key: 'ALL', label: 'Semua', count: user.productCounts?.total ?? (user.allProducts?.length || 0) },
                    { key: 'ACTIVE', label: 'Aktif', count: user.productCounts?.active ?? (user.activeProducts?.length || 0) },
                    { key: 'PENDING_PAYMENT', label: 'Direview', count: user.productCounts?.pending ?? 0 },
                    { key: 'REJECTED', label: 'Ditolak', count: user.productCounts?.rejected ?? 0 },
                    { key: 'SOLD', label: 'Terjual', count: user.productCounts?.sold ?? user.soldCount ?? 0 },
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProductStatusFilter(key)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors flex min-w-0 flex-wrap items-center gap-1.5 ${
                        productStatusFilter === key
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {key === 'ACTIVE' && <CheckCircle2 size={13} aria-hidden="true" />}
                      {key === 'PENDING_PAYMENT' && <Clock size={13} aria-hidden="true" />}
                      {key === 'REJECTED' && <AlertCircle size={13} aria-hidden="true" />}
                      <span>{label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          productStatusFilter === key
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : key === 'PENDING_PAYMENT' && count > 0
                            ? 'bg-warning/10 text-warning'
                            : key === 'REJECTED' && count > 0
                            ? 'bg-destructive text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {(() => {
                const sourceProducts = isOwner
                  ? user.allProducts || user.activeProducts || []
                  : user.activeProducts || []

                const displayedProducts = sourceProducts.filter((p: any) => {
                  if (productStatusFilter === 'ALL') return true
                  return p.status === productStatusFilter
                })

                if (displayedProducts.length === 0) {
                  return (
                    <div className="text-center py-10 text-muted-foreground">
                      <ShoppingBag className="mx-auto mb-2 text-muted-foreground" size={40} />
                      <p className="font-medium text-sm">
                        {productStatusFilter === 'ALL'
                          ? 'Belum ada barang di akun ini'
                          : `Tidak ada produk dengan status ${productStatusFilter}`}
                      </p>
                      {isOwner && (
                        <Button
                          size="sm"
                          onClick={() => router.push('/products/new')}
                          className="mt-3 bg-primary hover:bg-primary/90"
                        >
                          + Jual Barang Sekarang
                        </Button>
                      )}
                    </div>
                  )
                }

                return (
                  <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {displayedProducts.map((product: any) => (
                      <div key={product.id} className="flex min-w-0 flex-col">
                        <ProductCard product={product} />

                        {/* Status Note & Action for Owner */}
                        {isOwner && product.status === 'PENDING_PAYMENT' && (
                          <div className="mt-2 p-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-[11px] space-y-1">
                            <div className="flex items-center gap-1 font-semibold text-warning">
                              <Clock size={12} />
                              Sedang Direview Admin
                            </div>
                            <p className="text-[10px] text-warning">
                              Bukti transfer Anda sedang diverifikasi admin sebelum tampil di katalog.
                            </p>
                          </div>
                        )}

                        {isOwner && product.status === 'REJECTED' && (
                          <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-1 font-bold text-destructive">
                              <AlertCircle size={14} className="text-destructive shrink-0" />
                              Pembayaran Ditolak Admin
                            </div>
                            <div className="bg-card/80 p-1.5 rounded border border-destructive/30">
                              <p className="text-[10px] text-muted-foreground font-semibold">Alasan Penolakan:</p>
                              <p className="text-[11px] text-destructive font-medium mt-0.5">
                                {product.rejectionReason || 'Bukti transfer tidak valid atau belum masuk.'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              className="w-full whitespace-normal text-xs h-auto min-h-10 py-2 bg-card text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold"
                            >
                              Edit / Upload Ulang Bukti
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="mx-auto mb-2 text-muted-foreground" size={40} />
                  <p>Belum ada ulasan</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-medium text-sm">
                            {review.buyer?.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div className="min-w-0 break-words">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-sm text-foreground">
                                {review.buyer?.name || 'Pembeli'}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    className={
                                      i < review.score
                                        ? 'fill-warning text-warning'
                                        : 'text-muted-foreground'
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {review.product?.title && <span className="mt-1 block">{review.product.title}</span>}
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
        <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profil Akun">
          <div className="bg-card text-foreground rounded-xl shadow-xl max-w-md min-w-0 w-full p-4 sm:p-6 space-y-4 max-h-[calc(100dvh-2*max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain">
            <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border pb-3">
              <h3 id="edit-profile-title" className="min-w-0 font-bold text-lg text-foreground flex items-center gap-2">
                <Edit3 size={18} className="text-primary" />
                Edit Profil Akun
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                aria-label="Tutup edit profil"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-1 pb-2">
                <label className="group cursor-pointer relative block w-20 h-20 rounded-full focus-within:ring-2 focus-within:ring-ring" title="Ketuk untuk ganti foto profil">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Preview avatar" className="w-full h-full object-cover" />
                    ) : (
                      editName.charAt(0).toUpperCase() || <User size={32} />
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-foreground/60 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {uploadingAvatar
                      ? <Loader2 className="animate-spin motion-reduce:animate-none text-primary-foreground" size={22} />
                      : <Camera className="text-primary-foreground" size={22} />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Ganti foto profil"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar || savingProfile}
                  />
                </label>
                <p className="text-[11px] text-muted-foreground">
                  {uploadingAvatar ? 'Mengunggah foto...' : 'Ketuk untuk ganti foto profil'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-xs font-semibold text-foreground">
                  Nama Lengkap <span className="text-destructive">*</span>
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
                <Label htmlFor="editPhone" className="text-xs font-semibold text-foreground">
                  Nomor WhatsApp <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="editPhone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Nomor ini digunakan pembeli untuk menghubungi Anda via pesan otomatis WA saat janjian COD.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCampus" className="text-xs font-semibold text-foreground">
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
                <Label htmlFor="editFaculty" className="text-xs font-semibold text-foreground">
                  Fakultas / Jurusan
                </Label>
                <Input
                  id="editFaculty"
                  value={editFaculty}
                  onChange={(e) => setEditFaculty(e.target.value)}
                  placeholder="cth. Fakultas Teknik / Ilmu Komputer"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 border-t border-border sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="min-w-0 flex-1"
                  disabled={savingProfile}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 gap-1.5"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
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
        </Modal>
      )}
    </div>
  )
}
