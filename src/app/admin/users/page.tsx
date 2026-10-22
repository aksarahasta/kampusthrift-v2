'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { Role } from '@prisma/client'
import { formatRupiah } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  campusName?: string | null
  isVerifiedStudent: boolean
  honestyScore: number
  createdAt: string
  _count: {
    products: number
    reviewsReceived: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const json = await res.json()

      if (res.ok) {
        setUsers(json.data || [])
      }
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSuspend = async (userId: string) => {
    if (!confirm('Yakin ingin suspend user ini?')) return
    // Note: Need to implement suspend functionality (e.g., add suspended boolean to user model)
    alert('Fitur suspend akan diimplementasikan saat ada suspended field di model User')
  }

  const handleBan = async (userId: string) => {
    if (!confirm('Yakin ingin ban permanent user ini? Semua produknya akan di-banned.')) return
    // Note: Need to implement ban functionality
    alert('Fitur ban akan diimplementasikan dengan relasi product banned')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="gap-2 text-slate-600"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard Admin
          </Button>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              Kelola User Platform
            </CardTitle>
            <CardDescription>
              Moderasi akun pengguna dan kelola suspension/ban untuk pelanggaran aturan
            </CardDescription>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Cari berdasarkan nama atau email user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm">
                Cari
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Tidak ada user yang ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 text-xs">
                      <th className="p-3">User</th>
                      <th className="p-3">Statistik</th>
                      <th className="p-3">Honesty Score</th>
                      <th className="p-3">Join Date</th>
                      <th className="p-3 text-right">Aksi Moderasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-slate-800 flex items-center gap-2">
                              {user.name}
                              {user.isVerifiedStudent && (
                                <Badge variant="default" className="text-[10px] bg-blue-600">
                                  Student
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                            {user.campusName && (
                              <p className="text-xs text-slate-400 mt-1">{user.campusName}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-600">
                              <strong>{user._count.products}</strong> produk
                            </span>
                            <span className="text-slate-600">
                              <strong>{user._count.reviewsReceived}</strong> ulasan
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              user.honestyScore >= 4.5
                                ? 'success'
                                : user.honestyScore >= 3.5
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {user.honestyScore.toFixed(1)}/5.0
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/users/${user.id}`, '_blank')}
                            className="h-8 w-8 p-0"
                            title="Lihat Profil"
                          >
                            <ExternalLink size={14} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspend(user.id)}
                            className="text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <Shield size={12} className="mr-1" />
                            Suspend
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBan(user.id)}
                            className="text-xs h-8"
                          >
                            <Ban size={12} className="mr-1" />
                            Ban Permanent
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
