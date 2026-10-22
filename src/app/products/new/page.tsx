'use client'

import React, { useState, useEffect } from 'react'
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
  ArrowLeft
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { ProductCategory } from '@prisma/client'

interface CodZone {
  id: string
  campusName: string
  locationName: string
  description?: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [codZones, setCodZones] = useState<CodZone[]>([])
  const [selectedCampus, setSelectedCampus] = useState('')

  // Media files states (minimal 1 Foto & 1 Video)
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
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      conditionPercentage: 85,
      isBarter: false,
    },
  })

  const watchBasePrice = watch('basePrice')
  const watchIsBarter = watch('isBarter')
  const watchCondition = watch('conditionPercentage')

  // Ambil daftar COD Zones
  useEffect(() => {
    async function loadCodZones() {
      try {
        const res = await fetch('/api/cod-zones')
        const json = await res.json()
        if (res.ok) {
          setCodZones(json.data || [])
          if (json.data && json.data.length > 0) {
            setSelectedCampus(json.data[0].campusName)
            setValue('campusName', json.data[0].campusName)
            setValue('codZoneId', json.data[0].id)
          }
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

  // Filter COD zones berdasarkan kampus yang dipilih
  const filteredCodZones = codZones.filter(
    (z) => !selectedCampus || z.campusName.toLowerCase() === selectedCampus.toLowerCase()
  )

  const campuses = Array.from(new Set(codZones.map((z) => z.campusName)))

  // Mock Upload Handler (simulasi upload foto/video)
  const handleFileUpload = (type: 'IMAGE' | 'VIDEO') => {
    setUploadingMedia(true)
    setTimeout(() => {
      if (type === 'IMAGE') {
        const mockImg = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800`
        setImages((prev) => [...prev, mockImg])
      } else {
        const mockVideo = `https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4`
        setVideoUrl(mockVideo)
      }
      setUploadingMedia(false)
    }, 1000)
  }

  const onSubmit = async (data: CreateProductInput) => {
    // Validasi Media Wajib: Min 1 Foto dan 1 Video
    if (images.length === 0) {
      setErrorMessage('Wajib mengunggah minimal 1 foto produk')
      return
    }
    if (!videoUrl) {
      setErrorMessage('Wajib mengunggah minimal 1 video bukti kondisi fisik produk')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const mediaPayload = [
        ...images.map((url, idx) => ({
          mediaUrl: url,
          mediaType: 'IMAGE',
          isPrimary: idx === 0,
        })),
        {
          mediaUrl: videoUrl,
          mediaType: 'VIDEO',
          isPrimary: false,
        },
      ]

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          media: mediaPayload,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat listing produk')
      }

      router.push(`/products/${result.data.id}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan')
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

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold">Harap Masuk Terlebih Dahulu</h2>
          <p className="text-sm text-slate-600">
            Anda harus memiliki akun dan login untuk menjual atau membarter barang di Kampus Thrift.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Masuk ke Akun
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-slate-600"
        >
          <ArrowLeft size={16} />
          Kembali
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
                  {/* Foto Upload */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                    <Camera className="mx-auto text-blue-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Foto Barang ({images.length}/5)</p>
                    <p className="text-[11px] text-slate-400 mb-3">Format JPG, PNG (Maks 10MB)</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-bl"
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
                      onClick={() => handleFileUpload('IMAGE')}
                      disabled={uploadingMedia || images.length >= 5}
                      className="text-xs"
                    >
                      {uploadingMedia ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                      + Tambah Foto
                    </Button>
                  </div>

                  {/* Video Upload */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                    <Video className="mx-auto text-purple-600 mb-2" size={28} />
                    <p className="text-xs font-medium text-slate-700">Video Kondisi Riil (Wajib 1)</p>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('VIDEO')}
                        disabled={uploadingMedia}
                        className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        {uploadingMedia ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                        + Unggah Video Bukti
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
                      <option value="BUKU_KULIAH">Buku Kuliah</option>
                      <option value="ALAT_KOS_RUMAH_TANGGA">Alat Kos & RT</option>
                      <option value="ELEKTRONIK">Elektronik</option>
                      <option value="FASHION">Fashion</option>
                      <option value="LAIN_LAIN">Lain-lain</option>
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="condition">Kondisi Fisik: {watchCondition}%</Label>
                      <span className="text-[11px] text-slate-500">
                        {watchCondition >= 90 ? 'Seperti Baru' : watchCondition >= 70 ? 'Cukup Baik' : 'Ada Jejak Pakai'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      {...register('conditionPercentage', { valueAsNumber: true })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    {errors.conditionPercentage && (
                      <p className="text-xs text-red-500">{errors.conditionPercentage.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Deskripsi Barang</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Jelaskan kondisi barang, kekurangan, kelengkapan, dan alasan dijual..."
                    {...register('description')}
                    className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Harga & Dynamic Markup Engine Section */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Penetapan Harga & Biaya Layanan
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
                    placeholder="cth. 75000"
                    {...register('basePrice', { valueAsNumber: true })}
                    className="bg-white"
                  />
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

              {/* Barter Option (Verified Student Only) */}
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
                        setSelectedCampus(e.target.value)
                        setValue('campusName', e.target.value)
                        const firstZone = codZones.find((z) => z.campusName === e.target.value)
                        if (firstZone) setValue('codZoneId', firstZone.id)
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
