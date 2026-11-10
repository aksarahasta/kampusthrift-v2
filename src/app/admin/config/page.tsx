'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Settings,
  DollarSign,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Tag,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { Role } from '@prisma/client'
import { formatRupiah } from '@/lib/utils'

export default function AdminConfigPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [listingFee, setListingFee] = useState<number>(2000)
  const [markupPercentage, setMarkupPercentage] = useState<number>(0)
  const [fixedFee, setFixedFee] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Simulation upload volume
  const [simUploads, setSimUploads] = useState<number>(100)

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/config')
        const json = await res.json()

        if (res.ok && json.data) {
          setListingFee(json.data.listingFee ?? 2000)
          setMarkupPercentage(json.data.markupPercentage ?? 0)
          setFixedFee(json.data.fixedFee ?? 0)
        }
      } catch (err) {
        console.error('Failed to load config', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingFee: Number(listingFee),
          markupPercentage: Number(markupPercentage),
          fixedFee: Number(fixedFee),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan konfigurasi')
      }

      setMessage({ text: 'Tarif biaya listing berhasil diperbarui!', type: 'success' })
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={40} />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <Button onClick={() => router.push('/')} className="mt-4 w-full">
            Kembali
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
          onClick={() => router.push('/admin')}
          className="gap-2 text-slate-600"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard Admin
        </Button>

        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Tag size={22} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Konfigurasi Biaya Listing (Pay-per-Listing)
                </CardTitle>
                <CardDescription>
                  Atur tarif biaya pasang produk yang wajib dibayar penjual di awal sebelum barang tayang di katalog
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {message && (
              <div
                className={`p-4 rounded-md text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 size={18} className="shrink-0" />
                ) : (
                  <AlertCircle size={18} className="shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Listing Fee Setting */}
              <div className="space-y-3 p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="listingFee" className="text-base font-bold text-emerald-950">
                      Tarif Biaya Pasang Iklan Produk (Listing Fee)
                    </Label>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Nominal yang harus dibayar penjual setiap kali mengupload 1 barang baru.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                    Model Utama
                  </span>
                </div>

                <div className="relative max-w-sm mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    Rp
                  </span>
                  <Input
                    id="listingFee"
                    type="number"
                    step="500"
                    min="0"
                    max="100000"
                    value={listingFee}
                    onChange={(e) => setListingFee(parseInt(e.target.value) || 0)}
                    className="pl-10 text-lg font-bold text-emerald-900 bg-white border-emerald-300"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[0, 1000, 2000, 3000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setListingFee(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        listingFee === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-emerald-50'
                      }`}
                    >
                      {preset === 0 ? 'Gratis (Rp 0 Promo)' : formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Benefit / Explanation Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Keunggulan Model Pay-per-Listing untuk KampusThrift:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Pendapatan Pasti:</strong> Platform langsung menerima pemasukan di muka setiap ada produk yang dipasang tanpa perlu menunggu barang laku.</li>
                  <li><strong>Harga Transparan:</strong> Pembeli melihat harga murni dari penjual tanpa markup terselubung.</li>
                  <li><strong>Kualitas Listing Terjaga:</strong> Mencegah penjual iseng mengupload barang spam atau tidak bermutu.</li>
                </ul>
              </div>

              {/* Revenue Projection Calculator */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-blue-600" />
                  <h4 className="font-semibold text-sm text-blue-900">
                    Simulasi Estimasi Pendapatan Platform
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="simUploads" className="text-xs shrink-0 text-slate-700">
                    Jumlah Upload Produk / Bulan:
                  </Label>
                  <Input
                    id="simUploads"
                    type="number"
                    step="50"
                    min="1"
                    value={simUploads}
                    onChange={(e) => setSimUploads(parseInt(e.target.value) || 0)}
                    className="h-8 max-w-[120px] bg-white text-xs font-semibold"
                  />
                  <span className="text-xs text-slate-500">produk</span>
                </div>

                <div className="bg-white p-3 rounded border border-blue-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tarif Listing per Produk:</span>
                    <span className="font-semibold">{formatRupiah(listingFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimasi Postingan Aktif:</span>
                    <span className="font-semibold">{simUploads} barang</span>
                  </div>
                  <div className="border-t pt-1.5 flex justify-between font-bold text-emerald-800 text-sm">
                    <span>Pendapatan Kotor Platform:</span>
                    <span className="text-emerald-600 text-base">{formatRupiah(listingFee * simUploads)}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan Tarif Listing
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
