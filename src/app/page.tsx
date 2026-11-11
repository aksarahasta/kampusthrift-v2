import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/cards/product-card'
import { MapPin, ShieldCheck, RefreshCw, ArrowRight, Camera, ShoppingBag, Search, BookOpen, Home, Laptop, Shirt, Package } from 'lucide-react'
import { ProductStatus } from '@prisma/client'

export const revalidate = 60

const CATEGORIES = [
  { label: 'Buku Kuliah', value: 'BUKU_KULIAH', icon: BookOpen },
  { label: 'Alat Kos & RT', value: 'ALAT_KOS_RUMAH_TANGGA', icon: Home },
  { label: 'Elektronik', value: 'ELEKTRONIK', icon: Laptop },
  { label: 'Fashion', value: 'FASHION', icon: Shirt },
  { label: 'Lain-lain', value: 'LAIN_LAIN', icon: Package },
]

export default async function HomePage() {
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
      media: { orderBy: { isPrimary: 'desc' }, take: 2 },
      codZone: { select: { campusName: true, locationName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  }).catch(() => [])

  return (
    <main className="min-h-screen">
      <section className="home-hero">
        <div className="container home-hero-layout">
          <div className="min-w-0">
            <h1>Jual beli & barter preloved di kampusmu</h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Buku kuliah, barang kos, elektronik, dan fashion dengan COD sekitar kampus.
            </p>
            <form action="/products" method="GET" className="home-search" role="search">
              <div className="home-search-field">
                <Search size={19} aria-hidden="true" />
                <label htmlFor="home-search" className="sr-only">Cari barang preloved</label>
                <input id="home-search" type="search" name="search" placeholder="Cari buku, barang kos…" />
              </div>
              <Button type="submit" size="lg">Cari</Button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline"><Link href="/products"><ShoppingBag size={17} className="mr-2" aria-hidden="true" />Jelajahi katalog</Link></Button>
              <Button asChild variant="ghost"><Link href="/products/new">Jual barang preloved</Link></Button>
            </div>
          </div>
          <dl className="home-facts">
            <div>
              <MapPin size={24} aria-hidden="true" />
              <div><dt>Radius 1-5 km</dt><dd>Temukan barang di sekitar kampusmu.</dd></div>
            </div>
            <div>
              <ShieldCheck size={24} aria-hidden="true" />
              <div><dt>COD Rp 0 ongkir</dt><dd>Bertemu langsung di Safe Zone kampus.</dd></div>
            </div>
            <div>
              <Camera size={24} aria-hidden="true" />
              <div><dt>100% video kondisi riil</dt><dd>Lihat kondisi barang sebelum bertemu.</dd></div>
            </div>
          </dl>
        </div>
      </section>

      <section className="market-section" aria-labelledby="categories-heading">
        <div className="container">
          <div className="market-section-heading">
            <h2 id="categories-heading">Kategori pilihan</h2>
            <Link href="/products" className="market-nav-link underline underline-offset-4">Semua kategori</Link>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link key={cat.value} href={`/products?category=${cat.value}`} className="category-link">
                  <Icon size={22} aria-hidden="true" />
                  <span className="min-w-0"><span className="block font-medium">{cat.label}</span><span className="mt-1 block text-xs text-muted-foreground">Lihat barang</span></span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="market-section" aria-labelledby="recent-products-heading">
        <div className="container">
          <div className="market-section-heading">
            <div className="min-w-0">
              <h2 id="recent-products-heading">Barang preloved terbaru</h2>
              <p className="mt-2 text-sm text-muted-foreground">Barang mahasiswa dengan video bukti kondisi, siap COD.</p>
            </div>
            <Button asChild variant="ghost"><Link href="/products">Lihat semua barang<ArrowRight size={17} className="ml-2" aria-hidden="true" /></Link></Button>
          </div>
          {recentProducts.length > 0 ? (
            <div className="product-grid">
              {recentProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center">
              <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={36} aria-hidden="true" />
              <h3 className="mx-auto text-xl">Belum ada produk yang tayang</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Jadilah yang pertama menjual buku, barang kos, atau pakaian preloved di kampus.</p>
              <Button asChild className="mt-5"><Link href="/products/new">Pasang iklan sekarang</Link></Button>
            </div>
          )}
        </div>
      </section>

      <section className="trust-section mt-6" aria-labelledby="trust-heading">
        <div className="container">
          <h2 id="trust-heading">Keunggulan Kampus Thrift</h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">Verifikasi email kampus (.ac.id), bukti kondisi, dan titik temu di kampus.</p>
          <div className="trust-list">
            <div>
              <h3 className="flex items-center gap-2"><Camera size={19} aria-hidden="true" />Wajib video kondisi</h3>
              <p>Video 5-60 detik memperlihatkan kondisi fisik barang sebelum transaksi.</p>
            </div>
            <div>
              <h3 className="flex items-center gap-2"><RefreshCw size={19} aria-hidden="true" />Tukar tambah (barter)</h3>
              <p>Mahasiswa terverifikasi (.ac.id) bisa menukar buku atau barang tanpa uang tunai.</p>
            </div>
            <div>
              <h3 className="flex items-center gap-2"><ShieldCheck size={19} aria-hidden="true" />COD Safe Zone Rp0</h3>
              <p>Bertemu di perpustakaan atau pos kampus tanpa ongkir kurir.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
