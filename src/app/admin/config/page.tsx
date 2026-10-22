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
  RefreshCw
} from 'lucide-react'
import { Role } from '@prisma/client'
import { formatRupiah, calculateDisplayPrice } from '@/lib/utils'

export default function AdminConfigPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [markupPercentage, setMarkupPercentage] = useState<number>(5.0)
  const [fixedFee, setFixedFee] = useState<number>(1000)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Simulation test base prices
  const [testBasePrice, setTestBasePrice] = useState<number>(50000)

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/config')
        const json = await res.json()

        if (res.ok && json.data) {
          setMarkupPercentage(json.data.markupPercentage ?? 5.0)
          setFixedFee(json.data.fixedFee ?? 1000)
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
          markupPercentage: Number(markupPercentage),
          fixedFee: Number(fixedFee),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan konfigurasi')
      }

      setMessage({ text: 'Konfigurasi markup berhasil disimpan!', type: 'success' })
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

  // Live simulation calculation
  const simDisplayPrice = calculateDisplayPrice(testBasePrice, markupPercentage, fixedFee)
  const simMarkupAmount = simDisplayPrice - testBasePrice

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
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Settings size={22} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Konfigurasi Markup Harga
                </CardTitle>
                <CardDescription>
                  Atur formula Dynamic Price Markup Engine platform (P_display = P_base + M_admin)
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
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Markup Percentage */}
                <div className="space-y-2 p-4 bg-slate-50 border rounded-lg">
                  <Label htmlFor="markupPercentage" className="text-sm font-semibold">
                    Persentase Markup (%)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Persentase yang ditambahkan dari harga asli penjual (P_base)
                  </p>
                  <div className="relative mt-2">
                    <Input
                      id="markupPercentage"
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={markupPercentage}
                      onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                      className="pr-8 bg-white font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                {/* Fixed Fee */}
                <div className="space-y-2 p-4 bg-slate-50 border rounded-lg">
                  <Label htmlFor="fixedFee" className="text-sm font-semibold">
                    Biaya Tetap Platform (Rp)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Biaya operasional tetap yang ditambahkan per transaksi
                  </p>
                  <div className="relative mt-2">
                    <Input
                      id="fixedFee"
                      type="number"
                      step="500"
                      min="0"
                      max="100000"
                      value={fixedFee}
                      onChange={(e) => setFixedFee(parseInt(e.target.value) || 0)}
                      className="pl-9 bg-white font-semibold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Rp
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Calculator Simulation */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-blue-600" />
                  <h4 className="font-semibold text-sm text-blue-900">
                    Simulasi Kalkulasi Real-time
                  </h4>
                </div>
                <p className="text-xs text-blue-700">
                  Uji coba bagaimana pembeli dan penjual akan melihat harga produk:
                </p>

                <div className="flex items-center gap-3">
                  <Label htmlFor="testBase" className="text-xs shrink-0 text-slate-700">
                    Harga Uji Coba (P_base):
                  </Label>
                  <Input
                    id="testBase"
                    type="number"
                    step="10000"
                    value={testBasePrice}
                    onChange={(e) => setTestBasePrice(parseInt(e.target.value) || 0)}
                    className="h-8 max-w-[150px] bg-white text-xs font-semibold"
                  />
                </div>

                <div className="bg-white p-3 rounded border border-blue-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Harga Bersih Diterima Penjual:</span>
                    <span className="font-semibold">{formatRupiah(testBasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Komponen Markup Platform ({markupPercentage}% + {formatRupiah(fixedFee)}):</span>
                    <span className="font-semibold text-amber-600">+ {formatRupiah(simMarkupAmount)}</span>
                  </div>
                  <div className="border-t pt-1.5 flex justify-between font-bold text-blue-900 text-sm">
                    <span>Harga Tayang ke Pembeli (P_display):</span>
                    <span className="text-blue-600">{formatRupiah(simDisplayPrice)}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan Konfigurasi
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
