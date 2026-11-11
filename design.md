# Design: Kampus Thrift

Sistem visual bersama untuk marketplace Kampus Thrift. Pertahankan identitas dan perilaku jual-beli saat menambah halaman.

## Sistem
- Genre: editorial, dengan kepadatan layar aplikasi untuk katalog dan formulir.
- Tema: Garden, latar oat terang dan hijau daun.
- Bentuk: marketplace berorientasi pencarian dan katalog produk nyata.
- Navigasi: navbar ringkas, menu akun seluler, dan navigasi bawah pada layar di bawah 768px.
- Tidak menambahkan statistik, testimoni, atau listing contoh sebagai fakta.

## Sumber token
- `src/app/tokens.css`: skala jarak, ukuran teks, font, durasi, lebar konten, dan tinggi navigasi.
- `src/app/globals.css`: token HSL semantik yang digunakan Tailwind, tema gelap, dan komposisi marketplace.
- `src/app/base.css`: reset pada native layer `hallmark-reset`, agar utilitas Tailwind tetap dapat menimpanya.
- Impor CSS memakai sintaks biasa, bukan `@import ... layer(base)`, karena loader Next.js 14 mengartikannya sebagai media query.

## Palet
- Background: `--background`, oat terang.
- Teks: `--foreground`, hijau gelap.
- Aksi utama: `--primary` dengan `--primary-foreground`.
- Permukaan: `--card`, `--muted`, dan `--secondary`.
- Teks pendukung: `--muted-foreground`.
- Garis/form: `--border`, `--input`, `--ring`.
- Status: `--success`, `--warning`, `--destructive`; sertakan label teks, bukan warna saja.
- Semua warna melalui token, bukan kelas palet Tailwind literal.

## Tipografi
- Headline: Vollkorn 600.
- Body, tombol, metadata, dan judul kartu produk: Hanken Grotesk.
- Keduanya dimuat lewat `next/font`, variabel font terpasang pada elemen `html`.
- Heading boleh membungkus; label navigasi ringkas tanpa kapital terlacak.

## Layout dan kontrol
- Konten utama maksimal 1280px, terpusat; gutter 16px di HP, 24px tablet, 40px desktop.
- Grid produk: satu kolom pada layar sangat kecil, dua di HP, tiga tablet, empat desktop.
- Field dan tombol standar 44px; aksi besar 48px.
- Tombol primer hijau, sekunder outline/ghost, radius menggunakan `--radius`.
- Navigasi bawah memperhitungkan safe area; bilah aksi produk harus berada di atasnya.
- Modal menggunakan komponen Radix bersama `src/components/ui/modal.tsx`.

## Motion dan aksesibilitas
- Tidak ada animasi dekoratif atau zoom foto saat hover.
- Fokus keyboard terlihat seketika; hormati reduced motion.
- Pertahankan label field, nama kontrol ikon, serta rute, handler, dan form yang ada.

## Ekspor
Token lokal di `src/app/tokens.css` dan `src/app/globals.css`; pemetaan utilitas di `tailwind.config.ts`.
