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
  X,
  Tag,
  CreditCard,
  Shield,
  Copy,
  Check
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { uploadMediaDirect } from '@/lib/upload'
import { ProductCategory } from '@prisma/client'
import { toast } from 'sonner'

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

  // Listing Fee state (Pay-per-Listing model)
  const [listingFee, setListingFee] = useState<number>(2000)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'TRANSFER'>('QRIS')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [copiedBank, setCopiedBank] = useState<string | null>(null)

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

  // Ambil tarif Listing Fee yang berlaku dari admin
  useEffect(() => {
    async function loadListingFee() {
      try {
        const res = await fetch('/api/products/calculate-price')
        const json = await res.json()
        if (res.ok && json.data?.listingFee !== undefined) {
          setListingFee(json.data.listingFee)
        }
      } catch (err) {
        console.error('Failed to load listing fee', err)
      }
    }
    loadListingFee()
  }, [])

  // Real Direct Upload Handler untuk Foto (Bypass Vercel 4.5MB limit)
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

      const result = await uploadMediaDirect(file, 'IMAGE')
      setImages((prev) => [...prev, result.mediaUrl])
      toast.success('Foto berhasil diunggah!')
    } catch (err: any) {
      console.error('Upload photo error:', err)
      setErrorMessage(err.message || 'Gagal mengunggah foto')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Real Direct Upload Handler untuk Video (Bypass Vercel 4.5MB limit)
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

      const result = await uploadMediaDirect(file, 'VIDEO')
      setVideoUrl(result.mediaUrl)
      toast.success('Video kondisi riil berhasil diunggah!')
    } catch (err: any) {
      console.error('Upload video error:', err)
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

    // Jika ada biaya listing, tampilkan modal pembayaran di awal
    if (listingFee > 0) {
      setPendingPayload(payload)
      setIsPaymentModalOpen(true)
    } else {
      executePublish(payload)
    }
  }

  const executePublish = async (payload: any) => {
    setLoading(true)
    setErrorMessage(null)
    setProcessingPayment(true)

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat listing')
      }

      toast.success(
        listingFee > 0
          ? `Pembayaran ${formatRupiah(listingFee)} berhasil! Produk Anda kini aktif di katalog.`
          : 'Produk berhasil dipublikasikan di katalog!'
      )

      setIsPaymentModalOpen(false)
      router.push(`/products/${json.data.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mempublikasikan produk')
      setIsPaymentModalOpen(false)
    } finally {
      setLoading(false)
      setProcessingPayment(false)
    }
  }

  const handleCopy = (text: string, bank: string) => {
    navigator.clipboard.writeText(text)
    setCopiedBank(bank)
    toast.success(`Nomor rekening ${bank} berhasil disalin`)
    setTimeout(() => setCopiedBank(null), 2000)
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
                      autoComplete="off"
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
                      autoComplete="off"
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

              {/* Harga Jual Produk Section */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="basePrice" className="text-slate-800 font-semibold">
                      Harga Jual Produk (Rp) <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Harga Bersih Asli
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Harga ini yang akan langsung dibayar pembeli saat transaksi COD tanpa markup terselubung.
                  </p>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      Rp
                    </span>
                    <Input
                      id="basePrice"
                      type="number"
                      step="1"
                      min="100"
                      placeholder="cth. 75000 / 12500"
                      {...register('basePrice', { valueAsNumber: true })}
                      className="pl-10 bg-white font-semibold text-slate-900"
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-xs text-red-500">{errors.basePrice.message}</p>
                  )}
                </div>

                {/* Listing Fee Notification Card */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                  <Tag size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Biaya Pasang Iklan (Listing Fee): {formatRupiah(listingFee)}</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {listingFee > 0
                        ? `Dibayar 1 kali di muka saat mempublikasikan produk ini. Setelah tayang, seluruh uang hasil penjualan Rp ${watchBasePrice ? Number(watchBasePrice).toLocaleString('id-ID') : '0'} 100% menjadi milik Anda!`
                        : 'Saat ini berlaku promo GRATIS pasang listing produk (Rp 0).'}
                    </p>
                  </div>
                </div>
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
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold mt-4 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Menyiapkan Listing...
                  </>
                ) : listingFee > 0 ? (
                  <>
                    <CreditCard size={18} className="mr-2" />
                    Lanjut Bayar Biaya Listing ({formatRupiah(listingFee)})
                  </>
                ) : (
                  'Tayangkan Barang Sekarang (Gratis)'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal Pembayaran Biaya Listing (Pay-per-Listing) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    Pembayaran Biaya Listing
                  </h3>
                  <p className="text-[11px] text-slate-500">Pasang Iklan Produk Preloved</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                disabled={processingPayment}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Mini Preview */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[0]}
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-200 rounded-lg shrink-0 flex items-center justify-center">
                  <Camera size={20} className="text-slate-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {watch('title') || 'Judul Barang'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Harga Jual: <span className="font-semibold text-blue-600">{formatRupiah(watch('basePrice') || 0)}</span>
                </p>
                <span className="inline-block mt-0.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                  {selectedCampus}
                </span>
              </div>
            </div>

            {/* Nominal Box */}
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <span className="text-xs uppercase tracking-wider text-emerald-100 font-medium">
                Total Tagihan Pasang Iklan
              </span>
              <div className="text-3xl font-extrabold mt-0.5">
                {formatRupiah(listingFee)}
              </div>
              <p className="text-[11px] text-emerald-100 mt-1">
                ✓ Sekali bayar • 100% hasil penjualan saat COD milik Anda
              </p>
            </div>

            {/* Metode Pembayaran Tabs */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Pilih Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M17 14h.01"/><path d="M14 17h.01"/></svg>
                  QRIS (Semua E-Wallet)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={16} />
                  GoPay / Dana
                </button>
              </div>
            </div>

            {/* Tampilan QRIS */}
            {paymentMethod === 'QRIS' && (
              <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center bg-white space-y-2.5">
                <div className="inline-block bg-slate-900 text-white text-[10px] font-bold px-3 py-0.5 rounded tracking-widest">
                  QRIS STANDAR NASIONAL
                </div>

                {/* Real QRIS Image */}
                <div className="mx-auto max-w-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/qris-kampusthrift.jpg"
                    alt="QRIS KampusThrift"
                    className="w-full rounded-lg border border-slate-200 shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    AKSA RAHASTA, AKSESORIS F • NMID: ID1025440120539
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Scan dari GoPay, Dana, OVO, ShopeePay, BCA Mobile, Livin, BRImo, dll.
                  </p>
                </div>
              </div>
            )}

            {/* Tampilan GoPay / Dana */}
            {paymentMethod === 'TRANSFER' && (
              <div className="space-y-2">
                {/* GoPay */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-green-700">GoPay</span>
                    <p className="text-sm font-mono font-bold text-slate-900">0895335301060</p>
                    <p className="text-[10px] text-slate-400">a.n. Laksmana Surya</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('0895335301060', 'GoPay')}
                    className="text-xs h-8 gap-1"
                  >
                    {copiedBank === 'GoPay' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copiedBank === 'GoPay' ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>

                {/* Dana */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-700">Dana</span>
                    <p className="text-sm font-mono font-bold text-slate-900">0895335301060</p>
                    <p className="text-[10px] text-slate-400">a.n. Laksmana Surya Prahasta</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('0895335301060', 'Dana')}
                    className="text-xs h-8 gap-1"
                  >
                    {copiedBank === 'Dana' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copiedBank === 'Dana' ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>
              </div>
            )}

            {/* Tombol Eksekusi Pembayaran */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                type="button"
                onClick={() => executePublish(pendingPayload)}
                disabled={processingPayment}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20"
              >
                {processingPayment ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Memverifikasi Pembayaran...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Konfirmasi & Bayar {formatRupiah(listingFee)}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={processingPayment}
                className="w-full text-xs text-slate-500 hover:text-slate-800 h-8"
              >
                Batal / Edit Data Produk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
