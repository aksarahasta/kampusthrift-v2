'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Role } from '@prisma/client'

interface CodZone {
  id: string
  campusName: string
  locationName: string
  description?: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminCodZonesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [zones, setZones] = useState<CodZone[]>([])
  const [loading, setLoading] = useState(true)
  const [editingZone, setEditingZone] = useState<CodZone | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    campusName: '',
    locationName: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchZones = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/cod-zones')
      const json = await res.json()
      if (res.ok) {
        setZones(json.data || [])
      }
    } catch (err) {
      console.error('Failed to load COD zones', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = '/api/admin/cod-zones'
      const method = editingZone ? 'PATCH' : 'POST'
      const body = editingZone
        ? { id: editingZone.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await fetchZones()
        setShowForm(false)
        setEditingZone(null)
        setFormData({ campusName: '', locationName: '', description: '' })
      }
    } catch (err) {
      console.error('Failed to save COD zone', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus COD zone ini?')) return

    try {
      const res = await fetch(`/api/admin/cod-zones?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setZones((prev) => prev.filter((z) => z.id !== id))
      } else {
        const json = await res.json()
        alert(json.error || 'Gagal menghapus')
      }
    } catch (err) {
      console.error('Failed to delete COD zone', err)
    }
  }

  const handleToggleActive = async (zone: CodZone) => {
    try {
      const res = await fetch('/api/admin/cod-zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: zone.id,
          isActive: !zone.isActive,
        }),
      })

      if (res.ok) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === zone.id ? { ...z, isActive: !z.isActive } : z
          )
        )
      }
    } catch (err) {
      console.error('Failed to toggle COD zone', err)
    }
  }

  const startEdit = (zone: CodZone) => {
    setEditingZone(zone)
    setFormData({
      campusName: zone.campusName,
      locationName: zone.locationName,
      description: zone.description || '',
    })
    setShowForm(true)
  }

  const cancelEdit = () => {
    setEditingZone(null)
    setShowForm(false)
    setFormData({ campusName: '', locationName: '', description: '' })
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

  // Group zones by campus
  const groupedZones = zones.reduce((acc, zone) => {
    if (!acc[zone.campusName]) acc[zone.campusName] = []
    acc[zone.campusName].push(zone)
    return acc
  }, {} as Record<string, CodZone[]>)

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10">
      <div className="container min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="min-h-11 h-auto justify-start whitespace-normal gap-2 text-muted-foreground"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard Admin
          </Button>

          <Button
            onClick={() => setShowForm(true)}
            className="min-h-11 gap-2"
          >
            <Plus size={16} />
            Tambah COD Zone
          </Button>
        </div>

        <Card className="min-w-0 shadow-sm border-border">
          <CardHeader className="min-w-0 p-4 sm:p-6">
            <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="text-primary" size={24} />
              Kelola COD Safe Zones
            </CardTitle>
            <CardDescription className="break-words">
              Titik temu aman transaksi di lingkungan kampus yang direkomendasikan kepada penjual dan pembeli
            </CardDescription>
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {/* Add/Edit Form */}
            {showForm && (
              <form onSubmit={handleSave} className="mb-6 p-4 bg-muted rounded-md space-y-4">
                <h4 className="font-semibold text-sm text-primary">
                  {editingZone ? 'Edit COD Safe Zone' : 'Tambah COD Safe Zone Baru'}
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="campus" className="text-xs">Nama Kampus</Label>
                    <Input
                      id="campus"
                      value={formData.campusName}
                      onChange={(e) => setFormData({ ...formData, campusName: e.target.value })}
                      placeholder="cth. Universitas Indonesia"
                      className="min-h-11 text-base sm:text-sm h-11 text-sm bg-card"
                      required
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="location" className="text-xs">Nama Lokasi</Label>
                    <Input
                      id="location"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      placeholder="cth. Perpustakaan Pusat UI"
                      className="min-h-11 text-base sm:text-sm h-11 text-sm bg-card"
                      required
                    />
                  </div>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="desc" className="text-xs">Deskripsi (Opsional)</Label>
                  <Input
                    id="desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="cth. Area lobi depan, ramai dan terang"
                    className="min-h-11 text-base sm:text-sm h-11 text-sm bg-card"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={saving} className="min-h-11 gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {editingZone ? 'Simpan Perubahan' : 'Tambah Zone'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="min-h-11 gap-2">
                    <X size={14} />
                    Batal
                  </Button>
                </div>
              </form>
            )}

            {/* Zones List grouped by campus */}
            {Object.keys(groupedZones).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="mx-auto text-muted-foreground mb-2" size={40} />
                <p>Belum ada COD Safe Zone yang terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedZones).map(([campus, campusZones]) => (
                  <div key={campus}>
                    <h4 className="font-semibold text-sm text-foreground mb-3 flex flex-wrap items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      {campus}
                      <Badge variant="outline" className="text-xs">
                        {campusZones.length} lokasi
                      </Badge>
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {campusZones.map((zone) => (
                        <div
                          key={zone.id}
                          className={`min-w-0 p-4 rounded-md flex flex-col gap-3 items-start justify-between ${
                            zone.isActive
                              ? 'bg-muted'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="min-w-0 break-words">
                            <p className="font-medium text-sm text-foreground">{zone.locationName}</p>
                            {zone.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{zone.description}</p>
                            )}
                            <Badge
                              variant={zone.isActive ? 'default' : 'secondary'}
                              className="text-xs mt-2"
                            >
                              {zone.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(zone)}
                              className="min-h-11 h-11 w-11 shrink-0 p-0"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(zone)}
                              className="min-h-11 h-11 w-11 shrink-0 p-0"
                              title={zone.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {zone.isActive ? <X size={12} /> : <Check size={12} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(zone.id)}
                              className="min-h-11 h-11 w-11 shrink-0 p-0 text-destructive hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
