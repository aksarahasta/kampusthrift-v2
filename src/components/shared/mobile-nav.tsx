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
    <nav className="mobile-navigation" aria-label="Navigasi seluler">
      <div className="mx-auto flex max-w-lg items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              data-highlight={item.highlight || undefined}
            >
              <Icon
                size={item.highlight ? 24 : 20}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
