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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="min-w-0 max-w-md w-full p-6 text-center">
          <AlertCircle className="mx-auto text-destructive mb-2" size={40} />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <Button onClick={() => router.push('/')} className="min-h-11 mt-4 w-full">
            Kembali
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10">
      <div className="container min-w-0 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin')}
          className="min-h-11 h-auto justify-start whitespace-normal gap-2 text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard Admin
        </Button>

        <Card className="min-w-0 shadow-sm border-border">
          <CardHeader className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Tag size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground">
                  Konfigurasi Biaya Listing (Pay-per-Listing)
                </CardTitle>
                <CardDescription className="break-words">
                  Atur tarif biaya pasang produk yang wajib dibayar penjual di awal sebelum barang tayang di katalog
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0 space-y-6">
            {message && (
              <div
                className={`p-4 rounded-md text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-success/10 border border-border text-success'
                    : 'bg-destructive/10 border border-border text-destructive'
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
              <div className="space-y-3 p-5 bg-primary/10 rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="listingFee" className="text-base font-bold text-success">
                      Tarif Biaya Pasang Iklan Produk (Listing Fee)
                    </Label>
                    <p className="text-xs text-success mt-0.5">
                      Nominal yang harus dibayar penjual setiap kali mengupload 1 barang baru.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-success/10 text-success rounded-full">
                    Model Utama
                  </span>
                </div>

                <div className="relative max-w-sm mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
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
                    className="min-h-11 text-base sm:text-sm pl-10 text-lg font-bold text-success bg-card border-border"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[0, 1000, 2000, 3000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setListingFee(preset)}
                      aria-pressed={listingFee === preset}
                      className={`min-h-11 text-sm px-3 py-2 rounded-md border transition-colors ${
                        listingFee === preset
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:bg-success/10'
                      }`}
                    >
                      {preset === 0 ? 'Gratis (Rp 0 Promo)' : formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Benefit / Explanation Box */}
              <div className="p-4 bg-muted rounded-md space-y-2 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <ShieldCheck size={16} className="text-primary" />
                  Keunggulan Model Pay-per-Listing untuk KampusThrift:
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Pendapatan Pasti:</strong> Platform langsung menerima pemasukan di muka setiap ada produk yang dipasang tanpa perlu menunggu barang laku.</li>
                  <li><strong>Harga Transparan:</strong> Pembeli melihat harga murni dari penjual tanpa markup terselubung.</li>
                  <li><strong>Kualitas Listing Terjaga:</strong> Mencegah penjual iseng mengupload barang spam atau tidak bermutu.</li>
                </ul>
              </div>

              {/* Revenue Projection Calculator */}
              <div className="p-4 bg-muted rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-primary" />
                  <h4 className="font-semibold text-sm text-primary">
                    Simulasi Estimasi Pendapatan Platform
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Label htmlFor="simUploads" className="text-sm text-foreground">
                    Jumlah Upload Produk / Bulan:
                  </Label>
                  <Input
                    id="simUploads"
                    type="number"
                    step="50"
                    min="1"
                    value={simUploads}
                    onChange={(e) => setSimUploads(parseInt(e.target.value) || 0)}
                    className="min-h-11 text-base sm:text-sm h-11 max-w-[120px] bg-card text-xs font-semibold"
                  />
                  <span className="text-xs text-muted-foreground">produk</span>
                </div>

                <div className="border-t border-border pt-3 space-y-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                    <span>Tarif Listing per Produk:</span>
                    <span className="font-semibold">{formatRupiah(listingFee)}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                    <span>Estimasi Postingan Aktif:</span>
                    <span className="font-semibold">{simUploads} barang</span>
                  </div>
                  <div className="border-t border-border pt-3 flex flex-wrap gap-2 justify-between font-bold text-success text-sm">
                    <span>Pendapatan Kotor Platform:</span>
                    <span className="text-success text-base">{formatRupiah(listingFee * simUploads)}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="min-h-11 w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-auto py-3 whitespace-normal" disabled={saving}>
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
