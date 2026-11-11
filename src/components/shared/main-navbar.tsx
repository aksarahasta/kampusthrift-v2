'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StudentBadge } from '@/components/shared/student-badge'
import { Shield, PlusCircle, LogOut, ShoppingBag, Star, Menu, X, User } from 'lucide-react'
import { Role } from '@prisma/client'

export function MainNavbar() {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = user?.role === Role.ADMIN
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl || null)
  const [userName, setUserName] = useState<string>(user?.name || '')

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (user?.avatarUrl) setAvatar(user.avatarUrl)
    if (user?.name) setUserName(user.name)

    if (user?.id && !user?.avatarUrl) {
      fetch(`/api/users/${user.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json?.data) {
            if (json.data.avatarUrl) setAvatar(json.data.avatarUrl)
            if (json.data.name) setUserName(json.data.name)
          }
        })
        .catch(() => {})
    }

    const handleProfileUpdate = (event: Event) => {
      const { detail } = event as CustomEvent<{ avatarUrl?: string | null; name?: string }>
      if (detail?.avatarUrl !== undefined) setAvatar(detail.avatarUrl)
      if (detail?.name) setUserName(detail.name)
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [user?.id, user?.avatarUrl, user?.name])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.getElementById('mobile-menu-toggle')?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <header className="market-navbar">
      <div className="container flex h-full items-center justify-between gap-3">
        <Link href="/" className="market-brand" aria-label="Kampus Thrift, beranda">
          <div className="market-brand-mark"><span>KT</span></div>
          <div className="flex min-w-0 flex-col">
            <span className="market-brand-name">Kampus Thrift</span>
            <span className="hidden text-xs text-muted-foreground sm:block">Preloved sekitar kampus</span>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-2 md:flex">
          <Link href="/products" className="market-nav-link" aria-current={pathname === '/products' ? 'page' : undefined}>
            <ShoppingBag size={17} aria-hidden="true" />Katalog
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/products/new"><PlusCircle size={17} className="mr-2" aria-hidden="true" />Jual barang</Link>
          </Button>
          {isAdmin && (
            <Link href="/admin" className="market-nav-link" aria-current={pathname.startsWith('/admin') ? 'page' : undefined}>
              <Shield size={17} aria-hidden="true" />Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Link href={`/users/${user.id}`} className="flex min-h-11 items-center gap-2 rounded-md p-1.5 hover:bg-muted" title="Lihat Profil Saya">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={userName || 'User'} width={36} height={36} className="h-full w-full object-cover" />
                  ) : userName ? userName.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="hidden flex-col text-left lg:flex">
                  <div className="flex items-center gap-1">
                    <span className="max-w-[110px] truncate text-sm font-medium">{userName || user.name}</span>
                    {user.isVerifiedStudent && <StudentBadge size="sm" showText={false} />}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star size={12} aria-hidden="true" />{user.honestyScore > 0 ? user.honestyScore.toFixed(1) : 'Baru'}
                  </span>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Keluar" aria-label="Keluar">
                <LogOut size={18} aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Link href="/login" className="market-nav-link">Masuk</Link>
              <Button asChild size="sm"><Link href="/register">Daftar</Link></Button>
            </div>
          )}
        </nav>

        <Button id="mobile-menu-toggle" variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={menuOpen} aria-controls="mobile-header-menu">
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </Button>
      </div>

      {menuOpen && (
        <nav id="mobile-header-menu" aria-label="Menu akun dan navigasi" className="max-h-[calc(100dvh-var(--navbar-height)-var(--mobile-nav-height)-env(safe-area-inset-bottom))] overflow-y-auto border-b border-border bg-card p-4 md:hidden">
          <div className="container flex flex-col gap-1">
            <Link href="/products" className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}><ShoppingBag size={18} aria-hidden="true" />Katalog</Link>
            <Link href="/products/new" className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}><PlusCircle size={18} aria-hidden="true" />Jual barang</Link>
            {isAdmin && <Link href="/admin" className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}><Shield size={18} aria-hidden="true" />Admin</Link>}
            {user ? (
              <>
                <Link href={`/users/${user.id}`} className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}><User size={18} aria-hidden="true" /><span className="truncate">{userName || user.name || 'Profil saya'}</span></Link>
                <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => signOut({ callbackUrl: '/' })}><LogOut size={18} aria-hidden="true" />Keluar</Button>
              </>
            ) : (
              <>
                <Link href="/login" className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}>Masuk</Link>
                <Link href="/register" className="market-nav-link justify-start" onClick={() => setMenuOpen(false)}>Daftar</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
