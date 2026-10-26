'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProductSchema, CreateProductInput } from '@/lib/validations/product'
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
  HelpCircle,
  ArrowLeft,
  UploadCloud,
  X
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { ProductCategory } from '@prisma/client'

interface CodZone {
  id: string
  campusName: string
  locationName: string
  description?: string | null
}

const UNNES_DEFAULT_ZONES: CodZone[] = [
  { id: 'ft-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Teknik (FT)' },
  { id: 'fik-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Keolahragaan (FIK)' },
  { id: 'fh-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Hukum (FH)' },
  { id: 'fisip-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)' },
  { id: 'fipp-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Ilmu Pendidikan dan Psikologi (FIPP)' },
  { id: 'fmipa-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)' },
  { id: 'fbs-unnes', campusName: 'Universitas Negeri Semarang (UNNES)', locationName: 'Fakultas Bahasa dan Seni (FBS)' },
]

const FALLBACK_CAMPUSES = [
  'Universitas Negeri Semarang (UNNES)',
]

export default function NewProductPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [codZones, setCodZones] = useState<CodZone[]>(UNNES_DEFAULT_ZONES)
  const [selectedCampus, setSelectedCampus] = useState('Universitas Negeri Semarang (UNNES)')

  // Media files states (minimal 1 Foto & 1 Video)
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

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
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      codZoneId: UNNES_DEFAULT_ZONES[0].id,
      conditionPercentage: 85,
      isBarter: false,
    },
  })

  const watchBasePrice = watch('basePrice')
  const watchIsBarter = watch('isBarter')
  const watchCondition = watch('conditionPercentage')

  // Ambil daftar COD Zones dari server (jika ada data dari DB)
  useEffect(() => {
    async function loadCodZones() {
      try {
        const res = await fetch('/api/cod-zones')
        const json = await res.json()
        if (res.ok && json.data && json.data.length > 0) {
          // Ambil hanya zona UNNES
          const unnesData = json.data.filter((z: CodZone) => z.campusName.includes('UNNES'))
          const finalData = unnesData.length > 0 ? unnesData : UNNES_DEFAULT_ZONES
          setCodZones(finalData)
          setSelectedCampus('Universitas Negeri Semarang (UNNES)')
          setValue('campusName', 'Universitas Negeri Semarang (UNNES)')
          setValue('codZoneId', finalData[0].id)
        }
      } catch (err) {
        console.error('Failed to load COD zones', err)
      }
    }
    loadCodZones()
  }, [setValue])

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

  // Real Upload Handler untuk Foto
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (images.length >= 5) {
      setErrorMessage('Maksimal 5 foto per listing')
      return
    }

    try {
      setUploadingImage(true)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'IMAGE')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengunggah foto')
      }

      setImages((prev) => [...prev, json.data.mediaUrl])
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah foto')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Real Upload Handler untuk Video
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Cek ukuran video lokal sebelum upload (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Ukuran file video maksimal 50MB')
      return
    }

    try {
      setUploadingVideo(true)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'VIDEO')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengunggah video')
      }

      setVideoUrl(json.data.mediaUrl)
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah video')
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  // Filter COD zones khusus UNNES
  const unnesZonesOnly = codZones.filter((z) => z.campusName.includes('UNNES'))
  const activeZones = unnesZonesOnly.length > 0 ? unnesZonesOnly : UNNES_DEFAULT_ZONES

  const displayCampuses = ['Universitas Negeri Semarang (UNNES)']
  const filteredCodZones = activeZones

  const onSubmit = async (data: CreateProductInput) => {
    if (images.length === 0) {
      setErrorMessage('Wajib mengunggah minimal 1 foto produk')
      return
    }
    if (!videoUrl) {
      setErrorMessage('Wajib mengunggah minimal 1 video bukti kondisi fisik produk')
      return
    }

    // Pastikan codZoneId terisi
    let finalZoneId = data.codZoneId
    if (!finalZoneId && codZones.length > 0) {
      finalZoneId = codZones[0].id
    }

    if (!finalZoneId) {
      setErrorMessage('Harap pilih titik COD Safe Zone kampus')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const mediaPayload = [
        ...images.map((url, idx) => ({
          mediaUrl: url,
          mediaType: 'IMAGE' as const,
          isPrimary: idx === 0,
        })),
        {
          mediaUrl: videoUrl,
          mediaType: 'VIDEO' as const,
          isPrimary: false,
        },
      ]

      const payload = {
        ...data,
        codZoneId: finalZoneId,
        campusName: selectedCampus || data.campusName,
        media: mediaPayload,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat listing')
      }

      router.push(`/products/${json.data.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mempublikasikan produk')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </Button>

        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Buat Listing Produk Preloved
                </CardTitle>
                <CardDescription>
                  Jual barang bekas Anda dengan aman dan tanpa ongkir kepada sesama mahasiswa
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Mode Penjual
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
              {/* Media Upload Section (Foto & Video Wajib) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    Bukti Kondisi Fisik Wajib
                    <span className="text-xs font-normal text-rose-500">* (1 Foto + 1 Video)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Untuk menjamin transparansi, pembeli wajib melihat video kondisi riil barang sebelum COD.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {/* Foto Upload Nyata */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageFileSelect}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    <Camera className="mx-auto text-blue-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Foto Barang ({images.length}/5)</p>
                    <p className="text-[11px] text-slate-400 mb-3">Pilih foto dari galeri HP/Laptop</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded border overflow-hidden shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-bl hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage || images.length >= 5}
                      className="text-xs"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin mr-1" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} className="mr-1" />
                          + Pilih Foto
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Video Upload Nyata */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoFileSelect}
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                    />

                    <Video className="mx-auto text-purple-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Video Bukti Kondisi (Wajib 1)</p>
                    <p className="text-[11px] text-slate-400 mb-3">Durasi 5-60 detik (Maks 50MB)</p>

                    {videoUrl ? (
                      <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          Video Terunggah
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        {uploadingVideo ? (
                          <>
                            <Loader2 size={12} className="animate-spin mr-1" />
                            Mengunggah Video...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} className="mr-1" />
                            + Pilih Video Bukti
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail Produk Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Judul Barang</Label>
                  <Input
                    id="title"
                    placeholder="cth. Buku Kalkulus Purcell Edisi 9 - Bekas Bagus"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="category">Kategori</Label>
                    <select
                      id="category"
                      {...register('category')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value={ProductCategory.BUKU_KULIAH}>Buku Kuliah</option>
                      <option value={ProductCategory.ALAT_KOS_RUMAH_TANGGA}>Alat Kos & RT</option>
                      <option value={ProductCategory.ELEKTRONIK}>Elektronik</option>
                      <option value={ProductCategory.FASHION}>Fashion</option>
                      <option value={ProductCategory.LAIN_LAIN}>Lain-lain</option>
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="condition">Kondisi Barang</Label>
                      <span className="text-xs font-semibold text-blue-600">
                        {watchCondition || 85}%
                      </span>
                    </div>
                    <input
                      type="range"
                      id="condition"
                      min="1"
                      max="100"
                      step="5"
                      {...register('conditionPercentage', { valueAsNumber: true })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Layak Pakai (50%)</span>
                      <span>Sangat Baik (85%)</span>
                      <span>Seperti Baru (99%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Deskripsi Kondisi & Kelengkapan</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Jelaskan kondisi riil, cacat jika ada, alasan jual, dan kelengkapan aksesoris..."
                    {...register('description')}
                    className="w-full p-3 rounded-md border border-input bg-background text-sm"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Dynamic Markup Engine Section */}
              <div className="space-y-3 p-4 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Dynamic Price Markup Engine
                    </h4>
                    <p className="text-xs text-blue-700">
                      Platform menghitung markup transparan agar Anda menerima bersih sesuai harga dasar (P_base).
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="basePrice" className="text-slate-800">
                    Harga Bersih Penjual (Rp)
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="1000"
                    placeholder="cth. 75000"
                    {...register('basePrice', { valueAsNumber: true })}
                    className="bg-white"
                  />
                  {errors.basePrice && (
                    <p className="text-xs text-red-500">{errors.basePrice.message}</p>
                  )}
                </div>

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

              {/* Barter Option Section */}
              <div className="space-y-3 p-4 bg-purple-50/60 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="text-purple-600" size={18} />
                    <Label htmlFor="isBarter" className="text-sm font-semibold text-purple-950 cursor-pointer">
                      Terima Tukar Tambah / Barter
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
                      Fitur Barter khusus untuk <strong>Verified Student</strong> (.ac.id). Silakan verifikasi email kampus Anda untuk membuka fitur ini.
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
                        placeholder="cth. Mau barter dengan helm bogo / novel Tere Liye"
                        {...register('barterTarget')}
                        className="bg-white text-xs"
                      />
                    </div>
                  )
                )}
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
                        const newCampus = e.target.value
                        setSelectedCampus(newCampus)
                        setValue('campusName', newCampus)
                        const matchingZone = codZones.find((z) => z.campusName.toLowerCase() === newCampus.toLowerCase())
                        if (matchingZone) {
                          setValue('codZoneId', matchingZone.id)
                        }
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {displayCampuses.map((campus) => (
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
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {(filteredCodZones.length > 0 ? filteredCodZones : UNNES_DEFAULT_ZONES).map((zone) => (
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
              <Button type="submit" className="w-full h-11 text-base mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Menerbitkan Listing...
                  </>
                ) : (
                  'Tayangkan Barang Sekarang'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
