# Profil dan Fitur Aplikasi Kampus Thrift

> Dokumen ringkas untuk membantu penyusunan laporan proyek. Isi disusun berdasarkan kode dan konfigurasi yang ada di repository; fitur yang masih menunggu migrasi database diberi catatan khusus.

## 1. Identitas Aplikasi

| Aspek | Keterangan |
|---|---|
| Nama | Kampus Thrift |
| Jenis aplikasi | Marketplace C2C berbasis web |
| Fokus | Jual-beli dan barter barang preloved di lingkungan kampus |
| Pengguna utama | Pembeli, penjual, dan administrator |
| Teknologi utama | Next.js, React, TypeScript, Prisma, PostgreSQL/Supabase |
| Target deployment | Vercel |

## 2. Ringkasan

Kampus Thrift adalah marketplace yang mempertemukan penjual dan pembeli barang preloved di lingkungan kampus. Pengguna dapat membuat listing, mencari barang, menentukan titik temu COD yang dikelola admin, dan—setelah permintaan pembelian diterima—melanjutkan komunikasi melalui WhatsApp.

Platform dirancang untuk mendukung transaksi lokal tanpa pengiriman barang melalui aplikasi. Pembayaran barang dilakukan langsung antara pembeli dan penjual saat COD. Aplikasi mencatat permintaan, reservasi, dan konfirmasi serah-terima, tetapi tidak menahan dana barang atau menyediakan escrow.

## 3. Latar Belakang dan Tujuan

Barang preloved masih layak pakai dapat dimanfaatkan kembali oleh pengguna lain. Namun, transaksi barang bekas membutuhkan informasi kondisi yang jelas, lokasi pertemuan yang disepakati, dan kepercayaan antara pihak yang belum saling mengenal.

Kampus Thrift bertujuan untuk:

- Memudahkan warga kampus menawarkan dan menemukan barang preloved.
- Menampilkan foto dan video kondisi barang pada listing.
- Mengarahkan pertemuan ke titik COD aman yang disediakan admin.
- Mencatat tahap permintaan dan penyelesaian transaksi.
- Menyediakan profil penjual dan ulasan berbasis transaksi selesai.
- Mendukung penggunaan melalui smartphone, tablet, laptop, dan layar lain.

## 4. Pengguna dan Hak Akses

### Pembeli dan penjual

Satu akun dapat digunakan untuk melihat katalog maupun membuat listing. Pengguna dapat mengajukan pembelian, mengelola transaksi yang melibatkan dirinya, serta memberikan ulasan setelah transaksi selesai.

### Mahasiswa terverifikasi

Pengguna yang memverifikasi email kampus berdomain `.ac.id` memperoleh status mahasiswa terverifikasi. Status tersebut ditampilkan sebagai badge dan menjadi syarat penggunaan fitur barter.

### Administrator

Admin mengelola konfigurasi platform, titik COD, moderasi produk dan pengguna, serta validasi bukti pembayaran biaya listing.

## 5. Fitur Utama

### 5.1 Akun dan verifikasi

- Registrasi dan login menggunakan email serta kata sandi.
- Kata sandi di-hash menggunakan bcrypt.
- Kode OTP dikirim melalui email; kode berlaku selama lima menit.
- Verifikasi email `.ac.id` memberi status mahasiswa terverifikasi.

Pengiriman OTP membutuhkan konfigurasi email/SMTP pada environment aplikasi.

### 5.2 Katalog dan pencarian

- Menampilkan listing produk yang aktif.
- Pencarian berdasarkan kata kunci.
- Filter kategori produk.
- Filter titik COD: semua titik atau satu titik tertentu.
- Filter barang barter dan penjual mahasiswa terverifikasi.
- Informasi harga, kondisi, penjual, dan titik COD tersedia pada kartu atau detail produk.

**Catatan lokasi:** filter radius tidak digunakan karena sistem belum memakai koordinat geografis untuk menghitung jarak. Titik COD merupakan lokasi publik yang dipilih penjual dari daftar aktif kelolaan admin; lokasi pribadi penjual tidak dikumpulkan.

### 5.3 Pembuatan listing

Penjual mengisi judul, deskripsi, kategori, harga, kondisi barang, kampus, dan titik COD. Listing mewajibkan minimal satu foto dan satu video kondisi barang.

Model biaya yang digunakan adalah **biaya per listing**:

1. Penjual mengirim bukti pembayaran biaya listing.
2. Listing menunggu validasi admin (`PENDING_PAYMENT`).
3. Jika disetujui, produk menjadi `ACTIVE` dan tampil di katalog; jika ditolak, penjual dapat memperbaiki bukti.

Biaya listing dapat diatur admin; API menggunakan nilai default Rp2.000 bila konfigurasi belum tersedia. Harga tayang barang saat ini sama dengan harga yang ditentukan penjual; biaya listing dibayar terpisah. Kalkulator harga saat ini tidak menambahkan markup, meskipun field markup lama masih ada di konfigurasi admin.

### 5.4 Transaksi COD

- Pembeli yang login dapat mengajukan pembelian produk aktif.
- Penjual dapat menerima atau menolak permintaan.
- Jika diterima, produk direservasi selama 24 jam dan kontak WhatsApp dibuka untuk pihak transaksi.
- Pembeli membayar langsung kepada penjual saat bertemu di Safe Zone; pembayaran barang tidak diproses oleh aplikasi.
- Pembeli dan penjual mengonfirmasi pembayaran/serah-terima di aplikasi. Produk menjadi `SOLD` setelah kedua pihak mengonfirmasi.
- Reservasi yang dibatalkan atau kedaluwarsa mengaktifkan kembali produk.

### 5.5 Ulasan dan reputasi

Pembeli yang tercatat menyelesaikan transaksi dapat memberi ulasan dan skor 1–5. Skor kejujuran penjual dihitung dari ulasan dan ditampilkan pada profil atau informasi produk.

### 5.6 Fitur administrator

- Mengelola Safe Zone COD yang tersedia.
- Mengatur biaya listing. Konfigurasi admin masih memiliki field markup lama, tetapi kalkulasi harga saat ini menggunakan harga yang ditentukan penjual tanpa markup.
- Memeriksa bukti pembayaran listing serta menyetujui atau menolak publikasi produk.
- Memoderasi produk dan mengelola pengguna.
- Melihat ringkasan aktivitas melalui dashboard admin.

## 6. Alur Penggunaan

### Alur penjual

1. Membuat akun dan memverifikasi email.
2. Mengisi detail produk, memilih titik COD, serta mengunggah foto dan video.
3. Membayar biaya listing dan mengirim bukti pembayaran.
4. Menunggu validasi admin; setelah disetujui produk tampil di katalog.
5. Menanggapi permintaan pembelian dan bertemu dengan pembeli di Safe Zone.

### Alur pembeli

1. Menjelajahi katalog, mencari produk, dan memakai filter titik COD atau kategori.
2. Membuka detail produk untuk memeriksa kondisi, harga, penjual, dan lokasi COD.
3. Mengajukan pembelian melalui aplikasi.
4. Setelah diterima penjual, menghubungi penjual melalui WhatsApp untuk menyepakati waktu.
5. Bertemu di Safe Zone, membayar langsung kepada penjual, lalu kedua pihak mengonfirmasi serah-terima.
6. Setelah transaksi selesai, pembeli dapat memberikan ulasan.

## 7. Status Produk dan Transaksi

Status produk yang digunakan meliputi:

- `PENDING_PAYMENT`: menunggu validasi biaya listing.
- `ACTIVE`: tampil dan dapat diminta pembeli.
- `RESERVED`: sedang direservasi untuk transaksi.
- `SOLD`: transaksi selesai dan dikonfirmasi kedua pihak.
- `REJECTED`: bukti pembayaran listing ditolak.
- `BANNED`: disembunyikan dari katalog oleh proses moderasi atau penghapusan lunak.

Status transaksi meliputi `PENDING_SELLER`, `RESERVED`, `DECLINED`, `CANCELLED`, `COMPLETED`, dan `EXPIRED`.

## 8. Teknologi dan Arsitektur

| Bagian | Teknologi/peran |
|---|---|
| Antarmuka | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS dan CSS global berbasis token desain |
| Autentikasi | NextAuth dan bcrypt |
| Validasi form/API | Zod dan React Hook Form |
| Database | PostgreSQL di Supabase, diakses melalui Prisma ORM |
| Penyimpanan media | Supabase Storage |
| Ikon | Lucide React |
| Hosting | Vercel sebagai target deployment |

Aplikasi menggunakan halaman Next.js untuk antarmuka dan route handler `/api/...` untuk autentikasi, katalog, listing, transaksi, ulasan, dan administrasi. Data relasional utama meliputi pengguna, produk, media produk, titik COD, transaksi, ulasan, OTP, dan konfigurasi sistem.

## 9. Keamanan dan Privasi

- Kata sandi disimpan dalam bentuk hash bcrypt, bukan teks biasa.
- Endpoint admin memerlukan peran administrator.
- Kontak WhatsApp tidak dibuka sebelum penjual menerima permintaan.
- Produk yang sedang direservasi tidak dapat diedit atau dihapus oleh penjual.
- Riwayat transaksi dipertahankan; produk tidak dihapus permanen saat ada relasi transaksi.
- Sistem menggunakan titik COD publik dan tidak meminta koordinat rumah atau lokasi pribadi penjual.

## 10. Batasan dan Status Implementasi

- Katalog menggunakan filter titik COD, bukan radius jarak, karena data koordinat geografis belum digunakan.
- Daftar Safe Zone saat ini dikonfigurasi untuk lingkungan UNNES.
- Pembayaran barang berlangsung langsung saat COD. Tidak ada escrow atau payment gateway untuk pembayaran barang.
- Pembayaran biaya listing menggunakan bukti pembayaran yang diverifikasi admin.
- Alur transaksi dan API sudah tersedia di kode, tetapi tabel `marketplace_transactions` masih memerlukan migrasi database Supabase sebelum fitur ini dapat digunakan pada deployment yang terhubung ke database tersebut.
- Baseline migrasi `0_init` telah disiapkan secara lokal, tetapi belum ditandai applied; migrasi transaksi juga belum dijalankan. Urutan deployment database perlu diselesaikan sebelum kode transaksi baru dirilis ke production.
- Email OTP dan upload media bergantung pada konfigurasi environment dan layanan eksternal.

## 11. Referensi Implementasi

- `src/app/page.tsx` — halaman beranda.
- `src/app/products/page.tsx` — katalog dan filter.
- `src/app/products/new/page.tsx` — formulir listing dan pembayaran biaya listing.
- `src/app/products/[id]/page.tsx` — detail produk dan alur transaksi.
- `src/app/admin/` — halaman administrasi.
- `src/app/api/` — API aplikasi.
- `prisma/schema.prisma` — model data Prisma.
- `docs/marketplace-transactions.md` — keputusan dan acceptance criteria transaksi.
- `docs/PRD.md` dan `docs/SRS.md` — dokumen kebutuhan produk.

> **Catatan penyusunan laporan:** bedakan fitur yang sudah tersedia di source code dengan fitur yang sudah aktif di production. Khusus alur transaksi, implementasi kode tersedia, tetapi deployment Supabase masih memerlukan baseline dan migrasi database.
