import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  MapPin,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Star,
  ArrowRight,
  Camera,
  MessageCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KT</span>
            </div>
            <span className="font-bold text-xl text-slate-800">Kampus Thrift</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button variant="ghost" size="sm">Katalog</Button>
            </Link>
            <Link href="/products/new">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                + Jual Barang
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <MapPin size={14} />
          Hyperlocal Marketplace untuk Mahasiswa
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Jual Beli & Barter<br />
          <span className="text-blue-600">Barang Preloved</span> di Kampusmu
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Transaksi aman tanpa ongkir dengan sistem COD di titik temu kampus.
          Bergabung dengan komunitas mahasiswa hemat dan eco-friendly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Mulai Jual/Beli
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              Pelajari Lebih Lanjut
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">1-5 km</div>
            <div className="text-sm text-slate-500">Radius Jangkauan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">Rp 0</div>
            <div className="text-sm text-slate-500">Ongkos Kirim</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-slate-500">Transparan</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Mengapa Kampus Thrift?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Platform marketplace yang dirancang khusus untuk ekosistem kampus dengan fitur-fitur unggulan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Video Bukti Kondisi</h3>
                <p className="text-slate-600 text-sm">
                  Penjual wajib unggah video kondisi barang asli. Tidak ada lagi kejutan barang tidak sesuai foto.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="text-emerald-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">COD Safe Zone</h3>
                <p className="text-slate-600 text-sm">
                  Titik temu aman di area kampus. Transaksi tunai/QRIS tanpa ongkos kirim dan repot packing.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="text-amber-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Honesty Score</h3>
                <p className="text-slate-600 text-sm">
                  Sistem rating kejujuran penjual berdasarkan keakuratan deskripsi barang. Cari penjual terpercaya.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Verified Student</h3>
                <p className="text-slate-600 text-sm">
                  Verifikasi email kampus (.ac.id) untuk mendapat badge resmi dan akses fitur barter eksklusif.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <RefreshCw className="text-rose-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fitur Barter</h3>
                <p className="text-slate-600 text-sm">
                  Tukar-menukar barang preloved dengan mahasiswa lain. Hemat dan sustainable!
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="text-cyan-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-2">WhatsApp Integration</h3>
                <p className="text-slate-600 text-sm">
                  Hubungi penjual langsung via WhatsApp dengan pesan otomatis. Transaksi lebih cepat dan personal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Cara Kerja
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Buyer Flow */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-600" />
                Untuk Pembeli
              </h3>
              <div className="space-y-4">
                {[
                  { step: 1, text: 'Cari barang di katalog dengan filter radius' },
                  { step: 2, text: 'Cek video kondisi dan honesty score penjual' },
                  { step: 3, text: 'Hubungi via WhatsApp & pilih COD spot' },
                  { step: 4, text: 'Transaksi langsung & beri rating' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {item.step}
                    </div>
                    <p className="text-slate-600 text-sm pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Flow */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600" />
                Untuk Penjual
              </h3>
              <div className="space-y-4">
                {[
                  { step: 1, text: 'Daftar akun & verifikasi email kampus' },
                  { step: 2, text: 'Upload barang dengan foto & video wajib' },
                  { step: 3, text: 'Tentukan harga atau opsi barter' },
                  { step: 4, text: 'Temui pembeli di COD spot & terima pembayaran' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {item.step}
                    </div>
                    <p className="text-slate-600 text-sm pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Siap Bertransaksi di Kampus Thrift?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Bergabung dengan komunitas mahasiswa hemat dan mulai jual beli barang preloved hari ini.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Daftar Sekarang — Gratis!
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 Kampus Thrift. Hyperlocal C2C Preloved Marketplace.</p>
        </div>
      </footer>
    </div>
  )
}
