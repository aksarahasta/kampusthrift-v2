# Software Requirements Specification (SRS)
## Kampus Thrift: Hyperlocal C2C Preloved Marketplace

**Versi:** 1.0  
**Tanggal:** Oktober 2026  
**Penulis:** Tim Pengembang Kampus Thrift  
**Status:** Disetujui  

---

## 1. Pendahuluan (Introduction)

### 1.1 Tujuan (Purpose)
Dokumen Software Requirements Specification (SRS) ini mendeskripsikan secara rinci kebutuhan perangkat lunak untuk sistem **Kampus Thrift**. Dokumen ini menjadi acuan utama bagi pengembang *frontend*, *backend*, *database administrator*, serta *quality assurance* dalam membangun sistem.

### 1.2 Cakupan Produk (Product Scope)
**Kampus Thrift** adalah platform *web-based marketplace hyperlocal* yang menghubungkan mahasiswa dan masyarakat umum di sekitar kampus (radius 1–5 km) untuk transaksi barang *preloved* (jual-beli dan barter) dengan sistem COD (*Cash on Delivery*) aman tanpa ongkos kirim.

### 1.3 Definisi & Singkatan (Definitions & Acronyms)
* **SRS**: Software Requirements Specification.
* **C2C**: Consumer-to-Consumer.
* **COD**: Cash on Delivery (Transaksi langsung di tempat).
* **OTP**: One-Time Password (Kode verifikasi sekali pakai).
* **Base Price ($P_{base}$)**: Harga asli yang ditetapkan oleh penjual.
* **Admin Markup ($M_{admin}$)**: Biaya layanan/keuntungan platform yang diatur oleh Admin.
* **Display Price ($P_{display}$)**: Harga akhir yang dilihat oleh pembeli ($P_{display} = P_{base} + M_{admin}$).

---

## 2. Deskripsi Umum (Overall Description)

### 2.1 Perspektif Produk (Product Perspective)
Kampus Thrift berdiri sebagai platform independen dengan integrasi layanan pihak ketiga:
* **Gateway OTP**: Pengiriman kode verifikasi via Email / WhatsApp API.
* **WhatsApp Deep Linking**: Jalur komunikasi awal transaksi antara pembeli dan penjual.

### 2.2 Kategori Pengguna & Hak Akses (User Classes & Benefits)

Sistem membedakan pengguna ke dalam 3 hierarki utama:

| Tipe Pengguna | Metode Verifikasi | Fitur & Benefit Khusus |
| :--- | :--- | :--- |
| **Masyarakat Umum (General User)** | OTP Email Biasa / Nomor WhatsApp | * Beli & Jual barang *preloved*.<br>* Pencarian berdasarkan radius.<br>* Tanpa *Student Badge*.<br>* Tidak dapat menggunakan fitur **Barter**. |
| **Mahasiswa Terverifikasi (Verified Student)** | OTP Email Kampus (`.ac.id`) | * Semua fitur Masyarakat Umum.<br>* **Verified Student Badge** di profil dan produk.<br>* Akses Fitur **Tukar-Menukar (Barter)**.<br>* Prioritas algoritma rekomendasi katalog.<br>* Diskon / Potongan *Platform Fee* (opsional). |
| **Administrator (Admin)** | Kredensial Khusus / Multi-Factor Auth | * Kontrol nilai *Markup* harga ($M_{admin}$).<br>* Moderasi postingan & blokir pengguna.<br>* Kelola daftar lokasi *COD Safe Zone*. |

### 2.3 Skema Keuntungan Platform (Monetization & Price Engine)
Sistem secara otomatis menerapkan kalkulasi harga sebelum produk ditayangkan di katalog:

$$P_{display} = P_{base} + M_{admin}$$

Di mana $M_{admin}$ ditentukan dari Dashboard Admin dalam bentuk:
1. **Persentase (%)**: $M_{admin} = P_{base} \times \text{Persentase}$
2. **Nominal Tetap (Flat Rp)**: $M_{admin} = \text{Nominal Flat}$
3. **Kombinasi**: $M_{admin} = (P_{base} \times \text{Persentase}) + \text{Nominal Flat}$

*Catatan Transaksi*: Saat terjadi kesepakatan COD via WhatsApp, sistem mengarahkan pembeli membayar senilai $P_{display}$. Penjual menyetorkan kelebihan $M_{admin}$ ke saldo komisi platform atau via potongan kuota lapak.

---

## 3. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### 3.1 Modul 1: Autentikasi & Verifikasi OTP (AUTH)

* **REQ-AUTH-01 (Registrasi Pengguna)**: Sistem harus menyediakan formulir pendaftaran akun menggunakan Nama, Email, Nomor WhatsApp, dan Kata Sandi.
* **REQ-AUTH-02 (Pengiriman OTP)**:
  * Pengguna umum menerima kode OTP (6 digit) via WhatsApp/Email biasa.
  * Pengguna mahasiswa menginput email domain `.ac.id` dan menerima OTP verifikasi ke email kampus tersebut.
* **REQ-AUTH-03 (Verifikasi Status Mahasiswa)**:
  * Jika OTP email `.ac.id` valid, sistem mengubah *field* `is_verified_student = TRUE`.
  * Akun otomatis mendapatkan *Verified Student Badge*.
* **REQ-AUTH-04 (Switch Mode User)**:
  * Pengguna terautentikasi dapat berpindah antarmuka antara **Mode Pembeli** dan **Mode Penjual** dalam satu klik tanpa perlu *re-login*.

---

### 3.2 Modul 2: Pricing Engine & Monetisasi (PRICING)

* **REQ-PRICE-01 (Pengaturan Markup Admin)**: Admin dapat menentukan dan mengubah nilai skema *markup* ($M_{admin}$) di Dashboard Admin (misal: Markup 5% atau Flat Rp 2.000).
* **REQ-PRICE-02 (Input Harga Penjual)**: Penjual memasukkan $P_{base}$ pada saat mengisi formulir tambah produk.
* **REQ-PRICE-03 (Kalkulasi Otomatis)**: Sistem secara otomatis menghitung $P_{display}$ dan menggunakannya pada tampilan kartu produk di katalog.
* **REQ-PRICE-04 (Transparansi Penjual)**: Pada ringkasan sebelum posting, penjual dapat melihat rincian:
  * Harga Diterima Penjual: $P_{base}$
  * Biaya Layanan Platform: $M_{admin}$
  * Harga Tayang ke Pembeli: $P_{display}$

---

### 3.3 Modul 3: Manajemen Produk & Barter (PRODUCT)

* **REQ-PROD-01 (Formulir Listing Produk)**: Penjual wajib menginput Judul, Deskripsi, Kategori, Kondisi (%), Lokasi Kampus/Radius, $P_{base}$, dan Pilihan COD Spot.
* **REQ-PROD-02 (Validasi Foto & Video Wajib)**:
  * Sistem menolak penayangan produk jika tidak ada **minimal 1 foto** dan **1 video singkat** kondisi riil.
* **REQ-PROD-03 (Modul Barter - Khusus Mahasiswa)**:
  * Pengguna berstatus `is_verified_student = TRUE` dapat mengaktifkan opsi *toggle* "Terima Barter".
  * Pengguna umum tidak dapat mengaktifkan opsi Barter.
* **REQ-PROD-04 (Manajemen Status Produk)**: Penjual dapat memperbarui status barang menjadi `ACTIVE`, `RESERVED`, atau `SOLD`.

---

### 3.4 Modul 4: Pencarian Hyperlocal & Filter (SEARCH)

* **REQ-SCH-01 (Filter Radius Jarak)**: Sistem dapat memfilter produk berdasarkan jarak (1 km, 2 km, 3 km, 5 km) dari posisi lokasi pengguna.
* **REQ-SCH-02 (Filter Kategori Kampus)**: Kategori terdiri dari *Buku Kuliah*, *Alat Kos & Rumah Tangga*, *Elektronik*, *Fashion*, dan *Lain-lain*.
* **REQ-SCH-03 (Filter Badge Mahasiswa)**: Pembeli dapat menyaring katalog untuk hanya menampilkan produk dari penjual yang memegang *Verified Student Badge*.

---

### 3.5 Modul 5: Transaksi COD & Rating Reputasi (TRANSACTION)

* **REQ-TX-01 (Generasi Pesan WhatsApp)**:
  * Tombol "Hubungi via WA" menghasilkan tautan otomatis:  
    `https://wa.me/[Nomor_Penjual]?text=Halo%20[Nama_Penjual],%20saya%20tertarik%20membeli%20[Judul_Barang]%20seharga%20Rp[P_display].%20Apakah%20bisa%20COD%20di%20[COD_Zone]?`
* **REQ-TX-02 (Pemberian Honesty Score)**:
  * Setelah transaksi selesai (`SOLD`), pembeli dapat memberi penilaian *Honesty Score* (1–5 bintang) dan ulasan kejujuran deskripsi.
* **REQ-TX-03 (Akumulasi Reputasi Penjual)**:
  * Sistem menghitung rata-rata *Honesty Score* dan menampilkannya di profil penjual serta *card* produk.

---

### 3.6 Modul 6: Dashboard Administrator (ADMIN)

* **REQ-ADM-01 (Manajemen Markup)**: Mengubah konfigurasi global untuk persentase/flat fee keuntungan platform.
* **REQ-ADM-02 (Moderasi Konten & Take Down)**: Admin dapat menghapus atau menyembunyikan (*banned*) produk yang melanggar ketentuan.
* **REQ-ADM-03 (Manajemen Pengguna)**: Admin dapat membekukan akun yang terindikasi penipuan.
* **REQ-ADM-04 (Kelola COD Safe Zone)**: Admin dapat menambah/mengenal daftar titik aman transaksi di lingkungan kampus.

---

## 4. Kebutuhan Antarmuka Eksternal (External Interface Requirements)

### 4.1 Antarmuka Pengguna (User Interface)
* Layout berbasis **Mobile-First Responsive Design**.
* Kartu produk wajib menampilkan: Foto, $P_{display}$, *Verified Student Badge* (jika ada), Jarak (km), dan *Honesty Score* Penjual.

### 4.2 Antarmuka Perangkat Lunak & API
* **OTP Gateway API**: Integrasi dengan penyedia layanan SMS/WA OTP (misal: Fonnte / Twilio) dan SMTP Mailer.
* **WhatsApp API**: Generasi pesan format *URL Encode*.

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 5.1 Keamanan (Security)
* Kode OTP harus kedaluwarsa (*expire*) dalam kurun waktu 5 menit.
* Password disimpan menggunakan enkripsi hashing `bcrypt` dengan *salt factor* minimal 10.
* Akses Dashboard Admin dilindungi oleh *Middleware Role Authorization* yang ketat.

### 5.2 Performa (Performance)
* Pemrosesan kalkulasi harga $P_{display}$ dan pengembalian respons API katalog $\le 500 \text{ ms}$.
* Berkas video yang diunggah dikompresi otomatis ke format MP4 resolution $720p$ untuk efisiensi *bandwidth*.

### 5.3 Ketersediaan & Keandalan (Availability & Reliability)
* Sistem memiliki tingkat ketersediaan (*uptime*) $99.5\%$.
* Data media (foto/video) disimpan pada penyimpanan *cloud object storage* yang aman.

---

## 6. Matrix Keterlacakan Kebutuhan (Traceability Matrix)

| Kode Kebutuhan | Fitur Terkait | Sasaran Pengguna |
| :--- | :--- | :--- |
| **REQ-AUTH-02 & 03** | Verifikasi OTP Email Kampus | Mahasiswa (`.ac.id`) |
| **REQ-PRICE-01 s/d 04** | Dynamic Admin Markup Engine | Admin & Penjual |
| **REQ-PROD-03** | Fitur Tukar-Menukar (Barter) | Mahasiswa Terverifikasi |
| **REQ-SCH-01 & 03** | Pencarian Radius & Filter Student | Semua Pembeli |
| **REQ-TX-02 & 03** | Honesty Score & Reputasi | Semua Pengguna |