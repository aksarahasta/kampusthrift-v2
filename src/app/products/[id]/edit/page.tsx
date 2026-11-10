'use client'

import React, { useState, useEffect } from 'react'
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
  Trash2
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengunggah berkas')
      }

      const uploadedUrl = json.data.mediaUrl
      if (type === 'IMAGE') {
        setImages((prev) => [...prev, uploadedUrl])
        toast.success('Foto berhasil ditambahkan')
      } else {
        setVideoUrl(uploadedUrl)
        toast.success('Video berhasil diunggah')
      }
    } catch (err) {
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
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal memperbarui listing produk')
      }

      toast.success('Listing produk berhasil diperbarui!')
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
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-sm text-slate-500">Memuat formulir edit listing...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold">Harap Masuk Terlebih Dahulu</h2>
          <p className="text-sm text-slate-600">
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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/products/${id}`)}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Detail Produk
        </Button>

        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Edit Listing Produk
                </CardTitle>
                <CardDescription>
                  Perbarui informasi barang preloved, status penjualan, harga, atau foto
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Mode Edit Penjual
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Status Listing */}
              <div className="space-y-2 p-4 bg-blue-50/60 border border-blue-200 rounded-lg">
                <Label htmlFor="status" className="font-semibold text-slate-800 text-sm">
                  Status Ketersediaan Barang
                </Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm font-medium"
                >
                  <option value={ProductStatus.ACTIVE}>🟢 Aktif Dijual (ACTIVE)</option>
                  <option value={ProductStatus.RESERVED}>🟡 Sedang Dipesan / Janjian COD (RESERVED)</option>
                  <option value={ProductStatus.SOLD}>⚪ Sudah Terjual (SOLD)</option>
                </select>
                <p className="text-xs text-slate-500">
                  Pilih "Sedang Dipesan" jika ada pembeli yang sedang janjian COD, atau "Sudah Terjual" jika transaksi selesai.
                </p>
              </div>

              {/* Judul Barang */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-slate-700">
                  Judul Barang <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="cth. Buku Kalkulus Edisi 9 Original / Kipas Angin Meja"
                  {...register('title')}
                  className="bg-white"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Kategori & Kondisi */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-semibold text-slate-700">
                    Kategori <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="category"
                    {...register('category')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
                  >
                    <option value={ProductCategory.BUKU_KULIAH}>Buku Kuliah & Catatan</option>
                    <option value={ProductCategory.ALAT_KOS_RUMAH_TANGGA}>Alat Kos & RT</option>
                    <option value={ProductCategory.ELEKTRONIK}>Elektronik & Gadget</option>
                    <option value={ProductCategory.FASHION}>Pakaian & Fashion</option>
                    <option value={ProductCategory.LAIN_LAIN}>Lain-lain</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="conditionPercentage" className="font-semibold text-slate-700">
                      Tingkat Kondisi Fisik <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-sm font-bold text-emerald-600">
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
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Bekas pakai berat (50%)</span>
                    <span>Sangat mulus (95%)</span>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold text-slate-700">
                  Deskripsi Lengkap <span className="text-rose-500">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Jelaskan kondisi detail barang, minus (jika ada), kelengkapan, dll..."
                  {...register('description')}
                  className="w-full p-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Harga & Dynamic Markup */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="basePrice" className="font-semibold text-slate-800">
                    Harga Bersih yang Ingin Anda Terima (P_base) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      Rp
                    </span>
                    <Input
                      id="basePrice"
                      type="number"
                      placeholder="50000"
                      {...register('basePrice', { valueAsNumber: true })}
                      className="pl-10 bg-white font-medium"
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-xs text-red-500">{errors.basePrice.message}</p>
                  )}
                </div>

                {/* Transparency Markup Breakdown */}
                {priceDetails && (
                  <div className="bg-white p-3 rounded-md border border-blue-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Harga Diterima Penjual (P_base):</span>
                      <span className="font-semibold">{formatRupiah(priceDetails.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Biaya Layanan Platform ({priceDetails.markupPercentage}% + {formatRupiah(priceDetails.fixedFee)}):
                      </span>
                      <span className="font-semibold text-amber-600">
                        + {formatRupiah(priceDetails.markupAmount)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-bold text-blue-900">
                      <span>Harga Tayang ke Pembeli (P_display):</span>
                      <span className="text-blue-600">{formatRupiah(priceDetails.displayPrice)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barter Option */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="text-purple-600" size={18} />
                    <Label htmlFor="isBarter" className="font-semibold text-purple-900 cursor-pointer">
                      Terima Opsi Barter / Tukar Barang
                    </Label>
                  </div>
                  <input
                    type="checkbox"
                    id="isBarter"
                    {...register('isBarter')}
                    disabled={!isVerifiedStudent}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                </div>

                {!isVerifiedStudent ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                    <GraduationCap size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Fitur Barter khusus untuk <strong>Verified Student</strong> (.ac.id).
                    </span>
                  </div>
                ) : (
                  watchIsBarter && (
                    <div className="space-y-1 pt-1">
                      <Label htmlFor="barterTarget" className="text-xs text-purple-900">
                        Barang yang Anda Harapkan untuk Ditukar (Opsional)
                      </Label>
                      <Input
                        id="barterTarget"
                        placeholder="cth. Mau barter dengan helm bogo / novel"
                        {...register('barterTarget')}
                        className="bg-white text-xs"
                      />
                    </div>
                  )
                )}
              </div>

              {/* Media Section */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    Foto & Video Produk
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Minimal 1 foto produk. Anda dapat menambah atau menghapus media di bawah.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {/* Foto Upload */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                    <Camera className="mx-auto text-blue-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Foto Barang ({images.length}/5)</p>
                    <p className="text-[11px] text-slate-400 mb-3">Format JPG, PNG (Maks 10MB)</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl"
                            title="Hapus foto"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {images.length < 5 && (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {uploadingMedia ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                        + Tambah Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'IMAGE')}
                          disabled={uploadingMedia}
                        />
                      </label>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                    <Video className="mx-auto text-purple-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Video Kondisi Riil</p>
                    <p className="text-[11px] text-slate-400 mb-3">Video singkat 5-30 detik (MP4, WebM)</p>

                    {videoUrl ? (
                      <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Video Terpasang
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoUrl(null)}
                          className="text-rose-500 hover:underline text-[11px]"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100">
                        {uploadingMedia ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
                        + Unggah Video Bukti
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
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
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin size={16} className="text-blue-600" />
                  Titik Temu COD Safe Zone Kampus
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
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
                      className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
                    >
                      {campuses.map((campus) => (
                        <option key={campus} value={campus}>
                          {campus}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="codZoneId">Pilih Titik Aman (COD Safe Zone)</Label>
                    <select
                      id="codZoneId"
                      {...register('codZoneId')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
                    >
                      {filteredCodZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.locationName}
                        </option>
                      ))}
                    </select>
                    {errors.codZoneId && (
                      <p className="text-xs text-red-500">{errors.codZoneId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/products/${id}`)}
                  className="flex-1 h-11"
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 text-base bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
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

