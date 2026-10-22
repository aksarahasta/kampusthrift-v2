'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Home,
  ShoppingBag,
  PlusCircle,
  User,
  Shield
} from 'lucide-react'
import { Role } from '@prisma/client'

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === Role.ADMIN
  const isLoggedIn = !!session?.user

  // Don't show mobile nav on auth pages
  if (['/login', '/register', '/verify-otp'].includes(pathname)) {
    return null
  }

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: 'Katalog',
      href: '/products',
      icon: ShoppingBag,
      active: pathname.startsWith('/products') && pathname !== '/products/new',
    },
    {
      label: 'Jual',
      href: '/products/new',
      icon: PlusCircle,
      active: pathname === '/products/new',
      highlight: true,
    },
    {
      label: isLoggedIn ? 'Profil' : 'Masuk',
      href: isLoggedIn ? `/users/${session.user.id}` : '/login',
      icon: User,
      active: isLoggedIn ? pathname.startsWith('/users') : pathname === '/login',
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            href: '/admin',
            icon: Shield,
            active: pathname.startsWith('/admin'),
          },
        ]
      : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                item.highlight
                  ? 'text-blue-600 font-semibold'
                  : item.active
                  ? 'text-blue-600 font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon
                size={item.highlight ? 24 : 20}
                className={item.highlight ? 'text-blue-600' : ''}
              />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
