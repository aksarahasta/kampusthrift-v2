# Product Requirement Document (PRD): Kampus Thrift

**Versi:** 1.0  
**Tanggal:** Oktober 2026  
**Status:** Draf Final  
**Platform:** Web App / Mobile Web  
**Model Bisnis:** Hyperlocal C2C Preloved Marketplace  

---

## 1. Ringkasan Eksekutif & latar Belakang

**Kampus Thrift** adalah platform *marketplace hyperlocal* khusus ekosistem kampus dan masyarakat sekitarnya dalam radius 1–5 km. Platform ini memfasilitasi transaksi jual-beli dan tukar-menukar (*barter*) barang *preloved* (bekas pakai) antar-mahasiswa secara aman, hemat, dan efisien.

### Permasalahan Utama:
1. **Keraguan Kondisi Fisik Barang (64%)**: Pembeli barang bekas sering ragu terhadap kondisi barang asli vs foto produk.
2. **Biaya Kirim & Pengemasan**: Pembeli enggan membayar ongkos kirim untuk barang bernilai rendah, sedangkan penjual enggan repot melakukan pengemasan (*packing*) dan logistik ekspedisi.
3. **Kepercayaan Transaksi**: Risiko penipuan transaksi online anonim di platform umum.

### Solusi Utama:
1. **Verifikasi Video Wajib**: Penjual wajib melampirkan video bukti kondisi asli sebelum barang ditayangkan.
2. **COD Safe Zone & Rp0 Ongkir**: Rekomendasi titik temu transaksi langsung di fasilitas kampus terdekat.
3. **Sistem Reputasi *Honesty Score***: Penilaian keakuratan deskripsi yang terikat pada profil penjual.
4. **Verifikasi Identitas Kampus**: Penggunaan domain email resmi kampus (`.ac.id`) untuk mendapatkan *Verified Student Badge*.

---

## 2. Peran Pengguna (User Roles)

Sistem menggunakan **2 Peran Utama** untuk menjaga kesederhanaan *onboarding*:

| Peran | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **Pengguna Terintegrasi (User)** | Satu akun gabungan untuk Pembeli dan Penjual dengan fitur *Switch Mode*. | * Jelajah katalog & filter radius/fakultas.<br>* Mengubah status antarmuka ke Mode Pembeli atau Mode Penjual.<br>* Mengunggah *listing* barang (foto & video wajib).<br>* Menghubungi penjual via tautan WhatsApp otomatis.<br>* Memberikan *Honesty Score* / ulasan penjual. |
| **Administrator (Admin)** | Pengelola platform untuk menjaga kualitas dan keamanan ekosistem. | * Dashboard analitik platform.<br>* Moderasi dan *take down* barang yang melanggar.<br>* Pemblokiran/penangguhan akun bermasalah.<br>* Kelola daftar lokasi *COD Safe Zone*. |

---

## 3. Alur Kerja Pengguna (User Workflows)

### 3.1. Alur Registrasi & Verifikasi Mahasiswa
1. Pengguna mendaftar akun menggunakan nama, nomor WhatsApp, dan email.
2. Jika pendaftaran menggunakan email kampus berakhiran `.ac.id`, sistem secara otomatis memberikan **Verified Student Badge** di profil pengguna.
3. Pengguna dapat langsung bernavigasi tanpa harus menunggu verifikasi manual admin.

### 3.2. Alur Penjualan Barang (Mode Penjual)
1. Penjual menekan tombol **"Jual Barang"** / beralih ke Mode Penjual.
2. Penjual mengisi formulir barang: Judul, Deskripsi, Kategori, Harga (atau opsi Barter), Kondisi Fisik (%), serta Lokasi Kampus/Fakultas.
3. Penjual memilih titik **COD Safe Zone** yang direkomendasikan.
4. Penjual wajib mengunggah **minimal 1 Foto** dan **1 Video Singkat** kondisi barang.
5. Setelah formulir tervalidasi lengkap, *listing* otomatis berstatus `ACTIVE` dan tayang di katalog.

### 3.3. Alur Pembelian & Transaksi COD (Mode Pembeli)
1. Pembeli mengatur filter lokasi/radius (1–5 km) dan kategori barang.
2. Pembeli melihat detail barang, mengecek bukti video, serta memeriksa *Honesty Score* milik penjual.
3. Pembeli menekan tombol **"Hubungi Penjual via WhatsApp"**.
4. Sistem mengarahkan ke tautan WhatsApp dengan pesan otomatis (*pre-filled message*) berisi detail nama barang dan usulan titik COD.
5. Pembeli dan penjual bertemu langsung di *COD Safe Zone* kampus untuk transaksi Tunai/QRIS.
6. Penjual menandai status barang menjadi `SOLD`.
7. Pembeli memberikan ulasan dan *Honesty Score* yang tersimpan di profil histori penjual.

---

## 4. Persyaratan Fungsional (Functional Requirements)

### FR-1: Autentikasi & Manajemen Profil
* **FR-1.1**: Sistem harus mendukung registrasi dan login menggunakan email & kata sandi.
* **FR-1.2**: Sistem harus mendeteksi ekstensi domain `.ac.id` pada email pendaftaran untuk menyematkan *Verified Student Badge*.
* **FR-1.3**: Pengguna dapat mengedit informasi profil (Foto Profil, Nama, Nama Kampus, Fakultas, Nomor WhatsApp).
* **FR-1.4**: Profil pengguna harus menampilkan histori penjualan, barang aktif, serta nilai akumulasi *Honesty Score*.

### FR-2: Pencarian & Pencarian Hyperlocal (Hyperlocal Search & Filter)
* **FR-2.1**: Pencarian dapat difilter berdasarkan radius jarak (1 km, 2 km, 3 km, hingga 5 km) dari lokasi pengguna atau kampus yang dipilih.
* **FR-2.2**: Pengelompokan kategori produk mencakup: *Buku Kuliah*, *Alat Kos & Rumah Tangga*, *Elektronik*, *Fashion*, dan *Lain-lain*.
* **FR-2.3**: Filter tambahan mencakup: *Hanya Verified Student*, *Opsi Barter*, Rentang Harga, dan Kondisi Barang.

### FR-3: Manajemen *Listing* Produk (Jual & Barter)
* **FR-3.1**: Formulir *upload* produk memvalidasi keberadaan media foto dan video secara otomatis sebelum pengiriman.
* **FR-3.2**: Fitur penandaan mode **Barter**: Penjual dapat mencantumkan daftar barang ekspektasi yang dicari untuk ditukar.
* **FR-3.3**: Penjual dapat mengedit, menghapus, atau mengubah status barang (`ACTIVE`, `RESERVED`, `SOLD`).

### FR-4: Integrasi Komunikasi & COD Spot
* **FR-4.1**: Sistem menyediakan *drop-down* pilihan lokasi aman untuk COD (*COD Safe Zone*) seperti Perpustakaan Pusat, Kantin Dekanat, GSG Kampus, dsb.
* **FR-4.2**: Generasi Tautan WhatsApp Otomatis dengan format pesan:  
  `"Halo [Nama Penjual], saya tertarik dengan barang [Nama Barang] di Kampus Thrift. Apakah bisa COD di [Nama COD Spot]?"`

### FR-5: Sistem Rating & Kepercayaan (*Honesty Score*)
* **FR-5.1**: Pembeli yang telah bertransaksi dapat memberikan nilai *Honesty Score* (skala 1–5 bintang) beserta ulasan teks.
* **FR-5.2**: *Honesty Score* dihitung berdasarkan rata-rata akumulasi seluruh ulasan yang diterima oleh profil penjual.
* **FR-5.3**: Kartu produk menampilkan *Honesty Score* milik penjual untuk membantu pembeli dalam mengambil keputusan.

### FR-6: Dashboard Moderasi Admin
* **FR-6.1**: Admin dapat melihat daftar seluruh postingan barang dan akun pengguna.
* **FR-6.2**: Admin memiliki akses untuk mengubah status produk menjadi `BANNED` atau menghapusnya jika terbukti melanggar aturan.
* **FR-6.3**: Admin dapat membekukan (*suspend*) akun pengguna yang terindikasi melakukan penipuan.
* **FR-6.4**: Admin dapat mengelola (*create, read, update, delete*) daftar lokasi *COD Safe Zone* per wilayah kampus.

---

## 5. Persyaratan Non-Fungsional (Non-Functional Requirements)

* **Kinerja (Performance)**:
  * Waktu muat halaman utama dan katalog produk $\le 2$ detik pada jaringan 4G.
  * *Compress* otomatis pada berkas foto dan video yang diunggah untuk menghemat ruang penyimpanan dan mempercepat pemutaran media.
* **Kemudahan Penggunaan (Usability)**:
  * Antarmuka responsif (*Mobile-First Design*).
  * Kemudahan navigasi beralih antara Mode Pembeli dan Mode Penjual dalam $1$ kali klik.
* **Keamanan (Security)**:
  * Enkripsi kata sandi pengguna menggunakan metode *hashing* aman (misal: bcrypt).
  * Proteksi tautan nomor WhatsApp untuk mencegah penambangan data (*scraping*) oleh pihak luar.
* **Ketersediaan (Availability)**:
  * Sistem beroperasi dengan tingkat *uptime* minimal $99.5\%$.

---

## 6. Gambaran Skema Data (Entity Relationship Highlights)

```
[Users]
  ├── id (PK)
  ├── name
  ├── email (indikator .ac.id)
  ├── phone_whatsapp
  ├── is_verified_student (Boolean)
  ├── honesty_score (Float)
  └── role (USER / ADMIN)

[Products]
  ├── id (PK)
  ├── seller_id (FK -> Users.id)
  ├── title
  ├── description
  ├── price
  ├── is_barter (Boolean)
  ├── condition_percentage (Integer)
  ├── cod_zone_id (FK -> COD_Zones.id)
  ├── status (ACTIVE / RESERVED / SOLD / BANNED)
  └── created_at

[Media]
  ├── id (PK)
  ├── product_id (FK -> Products.id)
  ├── media_url
  └── media_type (IMAGE / VIDEO)

[Reviews]
  ├── id (PK)
  ├── seller_id (FK -> Users.id)
  ├── buyer_id (FK -> Users.id)
  ├── product_id (FK -> Products.id)
  ├── score (1 - 5)
  ├── comment
  └── created_at

[COD_Zones]
  ├── id (PK)
  ├── campus_name
  └── location_name
```

---

## 7. Indikator Keberhasilan (Key Performance Indicators)

1. **Adopsi Pengguna**: Minimal 500 pengguna terdaftar pada bulan pertama peluncuran di area kampus target.
2. **Tingkat Verifikasi Mahasiswa**: $\ge 70\%$ pengguna aktif terverifikasi menggunakan email `.ac.id`.
3. **Rasio Keaktifan Penjualan**: Minimal 30% dari total pengguna terdaftar mengunggah minimal 1 *listing* barang.
4. **Kepuasan Transaksi**: Rata-rata *Honesty Score* platform menjaga tingkat kepuasan di angka $\ge 4.5 / 5.0$.
5. **Kecepatan Pembelian**: Rata-rata barang *preloved* terjual atau berganti status menjadi `SOLD` dalam kurun waktu $\le 7$ hari sejak ditayangkan.

---

## 8. Rencana Pengembangan Masa Depan (Roadmap)

* **Fase 1 (MVP)**: Peluncuran fitur utama (Katalog, Upload Foto & Video Wajib, Verifikasi Email Kampus, COD Spot, Link WA, Honesty Score).
* **Fase 2**: Implementasi *In-App Chat* bawaan dan fitur geo-location otomatis (Maps API) untuk penentuan radius yang lebih presisi.
* **Fase 3**: Integrasi *Escrow Payment* (Rekening Bersama) opsional untuk pengiriman antarkampus yang berjarak lebih jauh.