'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProductSchema, UpdateProductInput } from '@/lib/validations/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Video,
  RefreshCw,
  GraduationCap,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  X
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { uploadMediaDirect } from '@/lib/upload'
import { ProductCategory, ProductStatus } from '@prisma/client'
import { toast } from 'sonner'

interface CodZone {
  id: string
  campusName: string
  locationName: string
  description?: string
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [codZones, setCodZones] = useState<CodZone[]>([])
  const [selectedCampus, setSelectedCampus] = useState('')

  // Media files states
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Product & Rejection state
  const [existingProduct, setExistingProduct] = useState<any | null>(null)
  const [newProofFile, setNewProofFile] = useState<File | null>(null)
  const [newProofPreview, setNewProofPreview] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const proofInputRef = useRef<HTMLInputElement | null>(null)

  // Price markup calculations state
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number
    markupAmount: number
    displayPrice: number
    markupPercentage: number
    fixedFee: number
  } | null>(null)

  const isVerifiedStudent = session?.user?.isVerifiedStudent ?? false

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
  })

  const watchBasePrice = watch('basePrice')
  const watchIsBarter = watch('isBarter')
  const watchCondition = watch('conditionPercentage')

  // Load existing product and COD zones
  useEffect(() => {
    async function initData() {
      try {
        setInitialLoading(true)

        // 1. Fetch COD Zones
        const codRes = await fetch('/api/cod-zones')
        const codJson = await codRes.json()
        const zones: CodZone[] = codJson.data || []
        setCodZones(zones)

        // 2. Fetch Product Detail
        const prodRes = await fetch(`/api/products/${id}`)
        const prodJson = await prodRes.json()

        if (!prodRes.ok) {
          throw new Error(prodJson.error || 'Produk tidak ditemukan')
        }

        const product = prodJson.data
        setExistingProduct(product)

        // Check ownership
        if (session?.user && product.sellerId !== session.user.id && session.user.role !== 'ADMIN') {
          throw new Error('Anda tidak memiliki hak untuk mengedit listing ini.')
        }

        // Set form values
        reset({
          title: product.title,
          description: product.description,
          category: product.category,
          basePrice: product.basePrice,
          isBarter: product.isBarter,
          barterTarget: product.barterTarget || '',
          conditionPercentage: product.conditionPercentage,
          campusName: product.campusName,
          codZoneId: product.codZoneId,
          status: product.status,
        })

        setSelectedCampus(product.campusName)

        // Set media
        const imgs = product.media
          .filter((m: any) => m.mediaType === 'IMAGE')
          .map((m: any) => m.mediaUrl)
        setImages(imgs)

        const vid = product.media.find((m: any) => m.mediaType === 'VIDEO')
        if (vid) setVideoUrl(vid.mediaUrl)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat data produk')
      } finally {
        setInitialLoading(false)
      }
    }

    if (authStatus !== 'loading') {
      initData()
    }
  }, [id, session, authStatus, reset])

  // Hitung Admin Markup secara real-time saat basePrice berubah
  useEffect(() => {
    async function calculateMarkup() {
      if (!watchBasePrice || watchBasePrice <= 0) {
        setPriceDetails(null)
        return
      }

      try {
        const res = await fetch('/api/products/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ basePrice: watchBasePrice }),
        })
        const json = await res.json()
        if (res.ok) {
          setPriceDetails(json.data)
        }
      } catch (err) {
        console.error('Failed to calculate markup', err)
      }
    }

    const timer = setTimeout(() => {
      calculateMarkup()
    }, 300)

    return () => clearTimeout(timer)
  }, [watchBasePrice])

  // Filter COD zones berdasarkan kampus yang dipilih
  const filteredCodZones = codZones.filter(
    (z) => !selectedCampus || z.campusName.toLowerCase() === selectedCampus.toLowerCase()
  )
  const campuses = Array.from(new Set(codZones.map((z) => z.campusName)))

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingMedia(true)
    try {
      const uploadedUrl = await uploadMediaDirect(file, type)

      if (type === 'IMAGE') {
        setImages((prev) => [...prev, uploadedUrl])
        toast.success('Foto berhasil ditambahkan')
      } else {
        setVideoUrl(uploadedUrl)
        toast.success('Video berhasil diunggah')
      }
    } catch (err) {
      console.error('Upload error in edit:', err)
      toast.error(err instanceof Error ? err.message : 'Gagal upload media')
    } finally {
      setUploadingMedia(false)
      e.target.value = ''
    }
  }

  const onSubmit = async (data: UpdateProductInput) => {
    if (images.length === 0) {
      setErrorMessage('Wajib memiliki minimal 1 foto produk')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      let paymentProofUrl: string | undefined = undefined
      if (newProofFile) {
        setUploadingProof(true)
        try {
          paymentProofUrl = await uploadMediaDirect(newProofFile, 'payment-proofs')
        } finally {
          setUploadingProof(false)
        }
      }

      const mediaPayload = [
        ...images.map((url, idx) => ({
          mediaUrl: url,
          mediaType: 'IMAGE',
          isPrimary: idx === 0,
        })),
        ...(videoUrl
          ? [
              {
                mediaUrl: videoUrl,
                mediaType: 'VIDEO',
                isPrimary: false,
              },
            ]
          : []),
      ]

      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          media: mediaPayload,
          paymentProofUrl,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal memperbarui listing produk')
      }

      if (paymentProofUrl) {
        toast.success('Bukti pembayaran berhasil diunggah ulang! Menunggu validasi admin.')
      } else {
        toast.success('Listing produk berhasil diperbarui!')
      }
      router.push(`/products/${id}`)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (authStatus === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin motion-reduce:animate-none text-primary mb-2" size={32} />
        <p className="text-sm text-muted-foreground">Memuat formulir edit listing...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-warning" size={48} />
          <h2 className="text-xl font-bold">Harap Masuk Terlebih Dahulu</h2>
          <p className="text-sm text-muted-foreground">
            Anda harus masuk ke akun untuk mengedit listing barang Anda.
          </p>
          <Button onClick={() => router.push(`/login?callbackUrl=/products/${id}/edit`)} className="w-full">
            Masuk ke Akun
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/products/${id}`)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Kembali ke Detail Produk
        </Button>

        <Card className="shadow-sm border-border">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  Edit Listing Produk
                </CardTitle>
                <CardDescription>
                  Perbarui informasi barang preloved, status penjualan, harga, atau foto
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                Mode Edit Penjual
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {existingProduct?.status === 'REJECTED' && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={24} className="shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm text-destructive">
                      Listing Ini Ditolak oleh Admin
                    </p>
                    <div className="mt-1 p-2 bg-card rounded border border-destructive/30">
                      <p className="text-[11px] text-muted-foreground font-semibold">Alasan Penolakan dari Admin:</p>
                      <p className="text-xs text-destructive font-medium mt-0.5">
                        {existingProduct.rejectionReason || 'Bukti transfer tidak valid atau belum masuk.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-card rounded-lg border border-destructive/30 space-y-2">
                  <Label className="text-xs font-semibold text-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                    <Camera size={14} />
                    Unggah Bukti Transfer Baru untuk Validasi Ulang:
                  </Label>
                  <input
                    ref={proofInputRef}
                    aria-label="Unggah bukti transfer baru"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setNewProofFile(file)
                      const r = new FileReader()
                      r.onload = (ev) => setNewProofPreview(ev.target?.result as string)
                      r.readAsDataURL(file)
                    }}
                  />
                  {newProofPreview ? (
                    <div className="relative max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newProofPreview}
                        alt="Bukti Baru"
                        className="w-full h-36 object-contain rounded border border-border bg-background"
                      />
                      <button
                        type="button"
                        aria-label="Hapus bukti pembayaran"
                        onClick={() => { setNewProofFile(null); setNewProofPreview(null) }}
                        className="absolute top-1 right-1 bg-destructive text-primary-foreground rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => proofInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-destructive/30 hover:border-destructive/30 rounded-lg p-3 text-center text-xs text-destructive hover:bg-destructive/10"
                    >
                      Unggah bukti transfer baru
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Setelah Anda menyimpan perubahan, status produk akan otomatis kembali ke <strong>Menunggu Validasi</strong> agar admin dapat memeriksa ulang.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Status Listing */}
              <div className="space-y-2 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <Label htmlFor="status" className="font-semibold text-foreground text-sm">
                  Status Ketersediaan Barang
                </Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-card text-sm font-medium"
                >
                  <option value={ProductStatus.ACTIVE}>Aktif Dijual (ACTIVE)</option>
                  <option value={ProductStatus.RESERVED}>Sedang Dipesan / Janjian COD (RESERVED)</option>
                  <option value={ProductStatus.SOLD}>Sudah Terjual (SOLD)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Pilih "Sedang Dipesan" jika ada pembeli yang sedang janjian COD, atau "Sudah Terjual" jika transaksi selesai.
                </p>
              </div>

              {/* Judul Barang */}
              <div className="min-w-0 space-y-2">
                <Label htmlFor="title" className="font-semibold text-foreground">
                  Judul Barang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="cth. Buku Kalkulus Edisi 9 Original / Kipas Angin Meja"
                  {...register('title')}
                  className="bg-card"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Kategori & Kondisi */}
              <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="category" className="font-semibold text-foreground">
                    Kategori <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    {...register('category')}
                    className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-card text-sm"
                  >
                    <option value={ProductCategory.BUKU_KULIAH}>Buku Kuliah & Catatan</option>
                    <option value={ProductCategory.ALAT_KOS_RUMAH_TANGGA}>Alat Kos & RT</option>
                    <option value={ProductCategory.ELEKTRONIK}>Elektronik & Gadget</option>
                    <option value={ProductCategory.FASHION}>Pakaian & Fashion</option>
                    <option value={ProductCategory.LAIN_LAIN}>Lain-lain</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <Label htmlFor="conditionPercentage" className="font-semibold text-foreground">
                      Tingkat Kondisi Fisik <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-sm font-bold text-success">
                      {watchCondition || 85}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    id="conditionPercentage"
                    {...register('conditionPercentage', { valueAsNumber: true })}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>Bekas pakai berat (50%)</span>
                    <span>Sangat mulus (95%)</span>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="min-w-0 space-y-2">
                <Label htmlFor="description" className="font-semibold text-foreground">
                  Deskripsi Lengkap <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Jelaskan kondisi detail barang, minus (jika ada), kelengkapan, dll..."
                  {...register('description')}
                  className="w-full min-w-0 p-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Harga Jual Produk */}
              <div className="space-y-3 p-4 bg-background border border-border rounded-lg">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="basePrice" className="font-semibold text-foreground">
                    Harga Jual Produk (Rp) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Harga yang ditampilkan ke calon pembeli di katalog (tanpa markup tersembunyi).
                  </p>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="basePrice"
                      type="number"
                      step="1"
                      min="100"
                      placeholder="50000"
                      {...register('basePrice', { valueAsNumber: true })}
                      className="pl-10 bg-card font-semibold text-foreground"
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-xs text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>
              </div>

              {/* Barter Option */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <RefreshCw className="text-primary" size={18} />
                    <Label htmlFor="isBarter" className="font-semibold text-primary cursor-pointer">
                      Terima Opsi Barter / Tukar Barang
                    </Label>
                  </div>
                  <input
                    type="checkbox"
                    id="isBarter"
                    {...register('isBarter')}
                    disabled={!isVerifiedStudent}
                    className="h-5 w-5 shrink-0 rounded border-border text-primary accent-primary focus:ring-ring disabled:opacity-50"
                  />
                </div>

                {!isVerifiedStudent ? (
                  <div className="p-2.5 bg-warning/10 border border-warning/30 rounded-md text-xs text-warning flex items-start gap-2">
                    <GraduationCap size={16} className="text-warning shrink-0 mt-0.5" />
                    <span>
                      Fitur Barter khusus untuk <strong>Verified Student</strong> (.ac.id).
                    </span>
                  </div>
                ) : (
                  watchIsBarter && (
                    <div className="space-y-1 pt-1">
                      <Label htmlFor="barterTarget" className="text-xs text-primary">
                        Barang yang Anda Harapkan untuk Ditukar (Opsional)
                      </Label>
                      <Input
                        id="barterTarget"
                        placeholder="cth. Mau barter dengan helm bogo / novel"
                        {...register('barterTarget')}
                        className="bg-card text-xs"
                      />
                    </div>
                  )
                )}
              </div>

              {/* Media Section */}
              <div className="space-y-3 p-4 bg-background border border-border rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                    Foto & Video Produk
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Minimal 1 foto produk. Anda dapat menambah atau menghapus media di bawah.
                  </p>
                </div>

                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Foto Upload */}
                  <div className="border border-dashed border-border rounded-lg p-4 text-center bg-card">
                    <Camera className="mx-auto text-primary mb-2" size={28} />
                    <p className="text-xs font-medium text-foreground">Foto Barang ({images.length}/5)</p>
                    <p className="text-[11px] text-muted-foreground mb-3">Format JPG, PNG (Maks 10MB)</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            aria-label={`Hapus foto ${idx + 1}`}
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-destructive text-primary-foreground text-[10px] w-6 h-6 flex items-center justify-center rounded-bl"
                            title="Hapus foto"
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {images.length < 5 && (
                      <label className="cursor-pointer inline-flex min-w-0 flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-background">
                        {uploadingMedia ? <Loader2 size={12} className="animate-spin motion-reduce:animate-none" /> : <Camera size={12} />}
                        + Tambah Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleFileUpload(e, 'IMAGE')}
                          disabled={uploadingMedia}
                        />
                      </label>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="border border-dashed border-border rounded-lg p-4 text-center bg-card">
                    <Video className="mx-auto text-primary mb-2" size={28} />
                    <p className="text-xs font-medium text-foreground">Video Kondisi Riil</p>
                    <p className="text-[11px] text-muted-foreground mb-3">Video singkat 5-30 detik (MP4, WebM)</p>

                    {videoUrl ? (
                      <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded text-xs text-success flex min-w-0 flex-wrap items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1">
                          <CheckCircle2 size={14} className="text-success" />
                          Video Terpasang
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoUrl(null)}
                          className="text-destructive hover:underline text-[11px]"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex min-w-0 flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-xs font-medium text-primary hover:bg-primary/10">
                        {uploadingMedia ? <Loader2 size={12} className="animate-spin motion-reduce:animate-none" /> : <Video size={12} />}
                        + Unggah Video Bukti
                        <input
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={(e) => handleFileUpload(e, 'VIDEO')}
                          disabled={uploadingMedia}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* COD Zone & Location Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  Titik Temu COD Safe Zone Kampus
                </h4>

                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="campusSelect">Pilih Kampus</Label>
                    <select
                      id="campusSelect"
                      value={selectedCampus}
                      onChange={(e) => {
                        setSelectedCampus(e.target.value)
                        setValue('campusName', e.target.value)
                        const firstZone = codZones.find((z) => z.campusName === e.target.value)
                        if (firstZone) setValue('codZoneId', firstZone.id)
                      }}
                      className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-card text-sm"
                    >
                      {campuses.map((campus) => (
                        <option key={campus} value={campus}>
                          {campus}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="codZoneId">Pilih Titik Aman (COD Safe Zone)</Label>
                    <select
                      id="codZoneId"
                      {...register('codZoneId')}
                      className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-card text-sm"
                    >
                      {filteredCodZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.locationName}
                        </option>
                      ))}
                    </select>
                    {errors.codZoneId && (
                      <p className="text-xs text-destructive">{errors.codZoneId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/products/${id}`)}
                  className="min-w-0 flex-1 h-auto min-h-11 whitespace-normal py-3"
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="min-w-0 flex-1 h-auto min-h-11 whitespace-normal py-3 text-base bg-primary hover:bg-primary/90"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin motion-reduce:animate-none mr-2" />
                      Menyimpan Perubahan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

