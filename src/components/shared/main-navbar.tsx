'use client'

import React from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { StudentBadge } from '@/components/shared/student-badge'
import {
  Shield,
  PlusCircle,
  LogOut,
  ShoppingBag,
  Sparkles
} from 'lucide-react'
import { Role } from '@prisma/client'

export function MainNavbar() {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = user?.role === Role.ADMIN

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-extrabold text-base tracking-tight">KT</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
              Kampus Thrift
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Hyperlocal C2C</span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-slate-700 hover:text-blue-600 font-medium">
              <ShoppingBag size={15} className="mr-1.5" />
              Katalog
            </Button>
          </Link>

          <Link href="/products/new">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-600/20"
            >
              <PlusCircle size={15} className="mr-1.5" />
              + Jual Barang
            </Button>
          </Link>

          {/* Admin Link if Admin */}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100">
                <Shield size={14} className="mr-1" />
                Admin
              </Button>
            </Link>
          )}

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href={`/users/${user.id}`}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Lihat Profil Saya"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">
                      {user.name}
                    </span>
                    {user.isVerifiedStudent && <StudentBadge size="sm" showText={false} />}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    ⭐ {user.honestyScore > 0 ? user.honestyScore.toFixed(1) : 'Baru'}
                  </span>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 px-2"
                title="Keluar"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 font-medium">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium">
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
