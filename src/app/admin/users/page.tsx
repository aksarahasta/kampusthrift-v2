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
        </div>

        <Card className="min-w-0 shadow-sm border-border">
          <CardHeader className="min-w-0 p-4 sm:p-6">
            <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="text-primary" size={24} />
              Kelola User Platform
            </CardTitle>
            <CardDescription className="break-words">
              Moderasi akun pengguna dan kelola suspension/ban untuk pelanggaran aturan
            </CardDescription>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-wrap gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Cari berdasarkan nama atau email user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-11 text-base sm:text-sm pl-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="min-h-11">
                Cari
              </Button>
            </form>
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Tidak ada user yang ditemukan.</p>
              </div>
            ) : (
              <div className="max-w-full min-w-0 overflow-x-auto">
                <table className="block w-full text-left text-sm md:table md:min-w-[960px]">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b bg-muted text-muted-foreground text-xs">
                      <th className="p-3">User</th>
                      <th className="p-3">Statistik</th>
                      <th className="p-3">Honesty Score</th>
                      <th className="p-3">Join Date</th>
                      <th className="p-3 text-right">Aksi Moderasi</th>
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-border md:table-row-group">
                    {users.map((user) => (
                      <tr key={user.id} className="block min-w-0 py-3 md:table-row md:py-0 hover:bg-muted/50">
                        <td data-label="User" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3">
                          <div>
                            <p className="font-semibold text-foreground flex flex-wrap items-center gap-2">
                              {user.name}
                              {user.isVerifiedStudent && (
                                <Badge variant="default" className="text-xs bg-primary/10 text-primary">
                                  Student
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                            {user.campusName && (
                              <p className="text-xs text-muted-foreground mt-1">{user.campusName}</p>
                            )}
                          </div>
                        </td>
                        <td data-label="Statistik" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">
                              <strong>{user._count.products}</strong> produk
                            </span>
                            <span className="text-muted-foreground">
                              <strong>{user._count.reviewsReceived}</strong> ulasan
                            </span>
                          </div>
                        </td>
                        <td data-label="Honesty Score" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3">
                          <Badge
                            variant={
                              user.honestyScore >= 4.5
                                ? 'success'
                                : user.honestyScore >= 3.5
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {user.honestyScore.toFixed(1)}/5.0
                          </Badge>
                        </td>
                        <td data-label="Join Date" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td data-label="Aksi moderasi" className="block min-w-0 break-words before:mb-1 before:block before:text-xs before:font-medium before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:before:hidden p-3 md:text-right [&>button]:mb-2 [&>button]:mr-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/users/${user.id}`, '_blank')}
                            className="min-h-11 h-11 w-11 shrink-0 p-0"
                            title="Lihat Profil"
                          >
                            <ExternalLink size={14} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspend(user.id)}
                            className="min-h-11 text-sm h-11 text-warning border-border hover:bg-warning/10"
                          >
                            <Shield size={12} className="mr-1" />
                            Suspend
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBan(user.id)}
                            className="min-h-11 text-sm h-11"
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
