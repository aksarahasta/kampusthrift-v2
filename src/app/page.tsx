import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductCard } from '@/components/cards/product-card'
import {
  MapPin,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Star,
  ArrowRight,
  Camera,
  ShoppingBag,
  Search,
  Sparkles,
  BookOpen,
  Home,
  Laptop,
  Shirt,
  Package
} from 'lucide-react'
import { ProductStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  { label: 'Buku Kuliah', value: 'BUKU_KULIAH', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { label: 'Alat Kos & RT', value: 'ALAT_KOS_RUMAH_TANGGA', icon: Home, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'Elektronik', value: 'ELEKTRONIK', icon: Laptop, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { label: 'Fashion', value: 'FASHION', icon: Shirt, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { label: 'Lain-lain', value: 'LAIN_LAIN', icon: Package, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
]

export default async function HomePage() {
  // Ambil produk terbaru yang sedang aktif
  const recentProducts = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          isVerifiedStudent: true,
          honestyScore: true,
          campusName: true,
        },
      },
      media: {
        orderBy: { isPrimary: 'desc' },
        take: 2,
      },
      codZone: {
        select: {
          campusName: true,
          locationName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
          <MapPin size={14} />
          Hyperlocal Marketplace 1–5 km Sekitar Kampus
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-5 leading-tight tracking-tight">
          Jual Beli & Barter<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Barang Preloved
          </span> di Kampusmu
        </h1>

        <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Temukan buku kuliah, alat kos, elektronik, hingga pakaian bekas berkualitas.
          Transaksi aman Rp0 ongkir dengan sistem COD di Safe Zone kampus.
        </p>

        {/* Quick Search Form */}
        <form action="/products" method="GET" className="max-w-xl mx-auto mb-8">
          <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border-2 border-blue-500/30 bg-white focus-within:border-blue-600 transition-all">
            <Search className="absolute left-4 text-slate-400" size={20} />
            <input
              type="text"
              name="search"
              placeholder="Cari buku kalkulus, rice cooker, kipas angin..."
              className="w-full py-3.5 pl-12 pr-28 text-sm outline-none text-slate-800 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-9 font-medium"
            >
              Cari
            </Button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/products">
            <Button size="lg" className="rounded-xl shadow-md shadow-blue-600/20 gap-2">
              <ShoppingBag size={18} />
              Jelajahi Katalog Lengkap
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="outline" size="lg" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
              + Jual Barang Preloved
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg mx-auto bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">1-5 km</div>
            <div className="text-[11px] sm:text-xs text-slate-500">Radius Kampus</div>
          </div>
          <div className="text-center border-x border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">Rp 0</div>
            <div className="text-[11px] sm:text-xs text-slate-500">Ongkos Kirim COD</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">100%</div>
            <div className="text-[11px] sm:text-xs text-slate-500">Video Kondisi Riil</div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            Kategori Pilihan
          </h2>
          <Link href="/products" className="text-xs font-semibold text-blue-600 hover:underline">
            Semua Kategori →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.value}
                href={`/products?category=${cat.value}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:shadow-md transition-all hover:border-blue-400 group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${cat.color} group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-slate-400">Lihat barang</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Barang Preloved Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Barang bekas mahasiswa siap COD hari ini dengan video bukti kondisi
            </p>
          </div>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-blue-600 gap-1 font-semibold text-xs sm:text-sm">
              Lihat Semua
              <ArrowRight size={15} />
            </Button>
          </Link>
        </div>

        {recentProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
            <ShoppingBag className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              Belum ada produk yang tayang
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Jadilah yang pertama menjual buku, barang kos, atau pakaian preloved Anda di kampus!
            </p>
            <Link href="/products/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                + Pasang Iklan Sekarang
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Why Kampus Thrift (Value Proposition) */}
      <section className="container mx-auto px-4 py-12 my-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Keunggulan Kampus Thrift
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 mb-4 leading-snug">
              Belanja Preloved Kampus Tanpa Ragu & Bebas Tipu-Tipu
            </h2>
            <p className="text-sm text-blue-100 mb-8 leading-relaxed">
              Dibuat khusus untuk ekosistem mahasiswa dengan sistem verifikasi email kampus (.ac.id), video bukti kondisi fisik, dan COD di safe zone kampus.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-white/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Camera size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Wajib Video Kondisi</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Semua barang wajib menyertakan video 5–60 detik agar tidak ada cacat yang disembunyikan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Fitur Tukar Tambah (Barter)</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Khusus mahasiswa terverifikasi (.ac.id) bisa saling tukar buku atau barang tanpa uang tunai.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">COD Safe Zone Rp0</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Titik temu aman di perpustakaan atau pos kampus tanpa resiko dan tanpa ongkir kurir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
