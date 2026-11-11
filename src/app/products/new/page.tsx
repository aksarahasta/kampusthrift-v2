'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProductSchema, CreateProductInput } from '@/lib/validations/product'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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
  QrCode,
  ClipboardList,
  AlertTriangle,
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

  // Proof of payment upload
  const proofInputRef = useRef<HTMLInputElement | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)

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
      setImages((prev) => [...prev, result])
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
      setVideoUrl(result)
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
      // Upload proof of payment first if provided
      let paymentProofUrl: string | null = null
      if (proofFile) {
        setUploadingProof(true)
        try {
          paymentProofUrl = await uploadMediaDirect(proofFile, 'payment-proofs')
        } finally {
          setUploadingProof(false)
        }
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, paymentProofUrl }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat listing')
      }

      toast.success('Produk berhasil dikirim! Menunggu validasi admin setelah bukti bayar diperiksa.')

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
    toast.success(`Nomor ${bank} berhasil disalin`)
    setTimeout(() => setCopiedBank(null), 2000)
  }

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan (JPG, PNG, dll)')
      return
    }
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin motion-reduce:animate-none text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </Button>

        <Card className="shadow-sm border-border">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
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

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {errorMessage && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Media Upload Section (Foto & Video Wajib) */}
              <div className="space-y-3 p-4 bg-background border border-border rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                    Bukti Kondisi Fisik Wajib
                    <span className="text-xs font-normal text-destructive">* (1 Foto + 1 Video)</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Untuk menjamin transparansi, pembeli wajib melihat video kondisi riil barang sebelum COD.
                  </p>
                </div>

                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Foto Upload Nyata */}
                  <div className="border border-dashed border-border rounded-lg p-4 text-center bg-card hover:border-primary/30 transition-colors">
                    <input
                      type="file"
                      ref={imageInputRef}
                      aria-label="Pilih foto barang"
                      onChange={handleImageFileSelect}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      autoComplete="off"
                    />

                    <Camera className="mx-auto text-primary mb-2" size={28} />
                    <p className="text-xs font-medium text-foreground">Foto Barang ({images.length}/5)</p>
                    <p className="text-[11px] text-muted-foreground mb-3">Pilih foto dari galeri HP/Laptop</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded border overflow-hidden shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            aria-label={`Hapus foto ${idx + 1}`}
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-destructive text-primary-foreground text-[9px] w-6 h-6 flex items-center justify-center rounded-bl hover:bg-destructive"
                          >
                            <X size={14} aria-hidden="true" />
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
                          <Loader2 size={12} className="animate-spin motion-reduce:animate-none mr-1" />
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
                  <div className="border border-dashed border-border rounded-lg p-4 text-center bg-card hover:border-primary/30 transition-colors">
                    <input
                      type="file"
                      ref={videoInputRef}
                      aria-label="Pilih video bukti kondisi"
                      onChange={handleVideoFileSelect}
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      autoComplete="off"
                    />

                    <Video className="mx-auto text-primary mb-2" size={28} />
                    <p className="text-xs font-medium text-foreground">Video Bukti Kondisi (Wajib 1)</p>
                    <p className="text-[11px] text-muted-foreground mb-3">Durasi 5-60 detik (Maks 50MB)</p>

                    {videoUrl ? (
                      <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded text-xs text-success flex min-w-0 flex-wrap items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1">
                          <CheckCircle2 size={14} className="text-success shrink-0" />
                          Video Terunggah
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="text-xs text-primary border-primary/30 hover:bg-primary/10"
                      >
                        {uploadingVideo ? (
                          <>
                            <Loader2 size={12} className="animate-spin motion-reduce:animate-none mr-1" />
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
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="title">Judul Barang</Label>
                  <Input
                    id="title"
                    placeholder="cth. Buku Kalkulus Purcell Edisi 9 - Bekas Bagus"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="category">Kategori</Label>
                    <select
                      id="category"
                      {...register('category')}
                      className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value={ProductCategory.BUKU_KULIAH}>Buku Kuliah</option>
                      <option value={ProductCategory.ALAT_KOS_RUMAH_TANGGA}>Alat Kos & RT</option>
                      <option value={ProductCategory.ELEKTRONIK}>Elektronik</option>
                      <option value={ProductCategory.FASHION}>Fashion</option>
                      <option value={ProductCategory.LAIN_LAIN}>Lain-lain</option>
                    </select>
                    {errors.category && (
                      <p className="text-xs text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <Label htmlFor="condition">Kondisi Barang</Label>
                      <span className="text-xs font-semibold text-primary">
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
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                    />
                    <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>Layak Pakai (50%)</span>
                      <span>Sangat Baik (85%)</span>
                      <span>Seperti Baru (99%)</span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <Label htmlFor="description">Deskripsi Kondisi & Kelengkapan</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Jelaskan kondisi riil, cacat jika ada, alasan jual, dan kelengkapan aksesoris..."
                    {...register('description')}
                    className="w-full min-w-0 p-3 rounded-md border border-input bg-background text-sm"
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Harga Jual Produk Section */}
              <div className="space-y-3 p-4 bg-background border border-border rounded-lg">
                <div className="min-w-0 space-y-1">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                    <Label htmlFor="basePrice" className="text-foreground font-semibold">
                      Harga Jual Produk (Rp) <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] bg-success/10 text-success font-semibold px-2 py-0.5 rounded-full">
                      Harga Bersih Asli
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Harga ini yang akan langsung dibayar pembeli saat transaksi COD tanpa markup terselubung.
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
                      placeholder="cth. 75000 / 12500"
                      {...register('basePrice', { valueAsNumber: true })}
                      className="pl-10 bg-card font-semibold text-foreground"
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-xs text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>

                {/* Listing Fee Notification Card */}
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs text-success flex items-start gap-2.5">
                  <Tag size={16} className="text-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Biaya Pasang Iklan (Listing Fee): {formatRupiah(listingFee)}</span>
                    <p className="text-[11px] text-success mt-0.5">
                      {listingFee > 0
                        ? `Dibayar 1 kali di muka saat mempublikasikan produk ini. Setelah tayang, seluruh uang hasil penjualan Rp ${watchBasePrice ? Number(watchBasePrice).toLocaleString('id-ID') : '0'} 100% menjadi milik Anda!`
                        : 'Saat ini berlaku promo GRATIS pasang listing produk (Rp 0).'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barter Option Section */}
              <div className="space-y-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <RefreshCw className="text-primary" size={18} />
                    <Label htmlFor="isBarter" className="text-sm font-semibold text-primary cursor-pointer">
                      Terima Tukar Tambah / Barter
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
                      Fitur Barter khusus untuk <strong>Verified Student</strong> (.ac.id). Silakan verifikasi email kampus Anda untuk membuka fitur ini.
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
                        placeholder="cth. Mau barter dengan helm bogo / novel Tere Liye"
                        {...register('barterTarget')}
                        className="bg-card text-xs"
                      />
                    </div>
                  )
                )}
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
                        const newCampus = e.target.value
                        setSelectedCampus(newCampus)
                        setValue('campusName', newCampus)
                        const matchingZone = codZones.find((z) => z.campusName.toLowerCase() === newCampus.toLowerCase())
                        if (matchingZone) {
                          setValue('codZoneId', matchingZone.id)
                        }
                      }}
                      className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {displayCampuses.map((campus) => (
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
                        className="w-full min-w-0 h-11 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {(filteredCodZones.length > 0 ? filteredCodZones : UNNES_DEFAULT_ZONES).map((zone) => (
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
              <Button
                type="submit"
                className="w-full h-auto min-h-12 whitespace-normal px-4 py-3 text-sm sm:text-base font-semibold mt-4 bg-primary hover:bg-primary/90 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin motion-reduce:animate-none mr-2" />
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
        <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Pembayaran Biaya Listing" closeDisabled={processingPayment}>
          <div className="bg-card text-foreground rounded-2xl max-w-md min-w-0 w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[calc(100dvh-2*max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain">
            {/* Header Modal */}
            <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 id="listing-payment-title" className="font-bold text-base text-foreground leading-tight">
                    Pembayaran Biaya Listing
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Pasang Iklan Produk Preloved</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                aria-label="Tutup pembayaran"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                disabled={processingPayment}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Mini Preview */}
            <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[0]}
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-muted rounded-lg shrink-0 flex items-center justify-center">
                  <Camera size={20} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {watch('title') || 'Judul Barang'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Harga Jual: <span className="font-semibold text-primary">{formatRupiah(watch('basePrice') || 0)}</span>
                </p>
                <span className="inline-block mt-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                  {selectedCampus}
                </span>
              </div>
            </div>

            {/* Nominal Box */}
            <div className="p-4 bg-primary rounded-xl text-primary-foreground shadow-md shadow-primary/10">
              <span className="text-xs text-primary-foreground/80 font-medium">
                Total Tagihan Pasang Iklan
              </span>
              <div className="text-3xl font-extrabold mt-0.5">
                {formatRupiah(listingFee)}
              </div>
              <p className="flex items-start gap-1.5 text-xs text-primary-foreground/80 mt-1">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Sekali bayar, 100% hasil penjualan saat COD milik Anda
              </p>
            </div>

            {/* Metode Pembayaran Tabs */}
            <div className="min-w-0 space-y-2">
              <Label className="text-xs font-semibold text-foreground">Pilih Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === 'QRIS'
                      ? 'border-success/30 bg-success/10 text-success font-bold shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-background'
                  }`}
                >
                  <QrCode size={16} className="shrink-0" aria-hidden="true" />
                  QRIS (Semua E-Wallet)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-success/30 bg-success/10 text-success font-bold shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-background'
                  }`}
                >
                  <CreditCard size={16} />
                  GoPay / Dana
                </button>
              </div>
            </div>

            {/* Tampilan QRIS */}
            {paymentMethod === 'QRIS' && (
              <div className="py-4 text-center space-y-2.5">
                <div className="inline-block bg-primary text-primary-foreground text-xs font-medium px-3 py-0.5 rounded">
                  QRIS standar nasional
                </div>

                {/* Real QRIS Image */}
                <div className="mx-auto max-w-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/qris-kampusthrift.jpg"
                    alt="QRIS KampusThrift"
                    className="w-full rounded-lg border border-border shadow-sm"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    AKSA RAHASTA, AKSESORIS F • NMID: ID1025440120539
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Scan dari GoPay, Dana, OVO, ShopeePay, BCA Mobile, Livin, BRImo, dll.
                  </p>
                </div>
              </div>
            )}

            {/* Tampilan GoPay / Dana */}
            {paymentMethod === 'TRANSFER' && (
              <div className="min-w-0 space-y-2">
                {/* GoPay */}
                <div className="p-3 bg-background border border-border rounded-lg flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-success">GoPay</span>
                    <p className="text-sm font-mono font-bold text-foreground">0895335301060</p>
                    <p className="text-[10px] text-muted-foreground">a.n. Laksmana Surya</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('0895335301060', 'GoPay')}
                    className="text-xs h-8 gap-1"
                  >
                    {copiedBank === 'GoPay' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedBank === 'GoPay' ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>

                {/* Dana */}
                <div className="p-3 bg-background border border-border rounded-lg flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary">Dana</span>
                    <p className="text-sm font-mono font-bold text-foreground">0895335301060</p>
                    <p className="text-[10px] text-muted-foreground">a.n. Laksmana Surya Prahasta</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('0895335301060', 'Dana')}
                    className="text-xs h-8 gap-1"
                  >
                    {copiedBank === 'Dana' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedBank === 'Dana' ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Bukti Pembayaran */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                <Camera size={13} />
                Upload Bukti Transfer / Screenshot Pembayaran
                <span className="text-destructive">*</span>
              </Label>
              <input
                ref={proofInputRef}
                aria-label="Upload bukti pembayaran"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProofFileChange}
              />
              {proofPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofPreview}
                    alt="Bukti Bayar"
                    className="w-full max-h-48 object-contain rounded-lg border border-border bg-background"
                  />
                  <button
                    type="button"
                    aria-label="Hapus bukti pembayaran"
                    onClick={() => { setProofFile(null); setProofPreview(null) }}
                    className="absolute top-1.5 right-1.5 bg-destructive text-primary-foreground rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-success/30 hover:text-success hover:bg-success/10 transition-colors"
                >
                  <UploadCloud size={20} className="mx-auto mb-1 opacity-50" />
                  Unggah bukti bayar
                  <br />
                  <span className="text-[10px] text-muted-foreground">(JPG, PNG — maks 10MB)</span>
                </button>
              )}
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                <ClipboardList size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Produk akan direview admin setelah bukti bayar diterima. Produk aktif setelah disetujui.
              </p>
            </div>

            {/* Tombol Eksekusi Pembayaran */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                type="button"
                onClick={() => executePublish(pendingPayload)}
                disabled={processingPayment || !proofFile}
                className="w-full h-auto min-h-11 whitespace-normal py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPayment ? (
                  <>
                    <Loader2 size={16} className="animate-spin motion-reduce:animate-none mr-2" />
                    {uploadingProof ? 'Mengupload bukti...' : 'Mengirim listing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Kirim Bukti &amp; Submit Listing
                  </>
                )}
              </Button>
              {!proofFile && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-center text-warning font-medium">
                  <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
                  Upload bukti pembayaran terlebih dahulu
                </p>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={processingPayment}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Batal / Edit Data Produk
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
