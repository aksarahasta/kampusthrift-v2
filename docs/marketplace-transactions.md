# Alur transaksi marketplace

## Keputusan produk

- Biaya listing dibayar penjual kepada platform sebelum listing ditayangkan dan tetap melalui validasi pembayaran yang sudah ada.
- Pembayaran barang dilakukan langsung dari pembeli kepada penjual ketika bertemu di COD. Platform tidak menahan dana dan tidak menyediakan escrow.
- Penjual memilih satu Safe Zone aktif yang dikelola admin. Katalog menyediakan filter semua titik COD atau satu titik tertentu; filter radius tidak dipakai tanpa koordinat yang valid.
- Lokasi pribadi penjual tidak dikumpulkan atau ditampilkan.
- Kontak WhatsApp hanya tersedia bagi pihak terkait setelah penjual menerima permintaan.

## Alur status

1. Pembeli login dan mengajukan permintaan pada produk `ACTIVE`.
2. Penjual menerima atau menolak. Penerimaan mengubah produk menjadi `RESERVED` selama 24 jam dan menolak permintaan aktif lain untuk produk yang sama.
3. Saat reservasi aktif, pembeli dan penjual mengatur pertemuan di Safe Zone. Pembeli membayar langsung kepada penjual.
4. Kedua pihak mengonfirmasi serah-terima di aplikasi. Produk menjadi `SOLD` hanya setelah konfirmasi dari kedua pihak.
5. Pembatalan reservasi atau kedaluwarsa mengembalikan produk ke `ACTIVE`. Pembeli yang memiliki transaksi `COMPLETED` dapat memberikan ulasan.

Status transaksi: `PENDING_SELLER`, `RESERVED`, `DECLINED`, `CANCELLED`, `COMPLETED`, `EXPIRED`.

## Kontrak API

- `POST /api/products/:id/transactions`: buat permintaan pembelian.
- `GET /api/products/:id/transactions`: ambil transaksi pembeli atau daftar permintaan penjual.
- `PATCH /api/transactions/:id` dengan `action`: `accept`, `decline`, `cancel`, atau `confirm`.
- `GET /api/products` menerima `codZoneId`. `radiusKm` tidak menjadi filter aktif.

Perubahan status transaksi dan produk dijalankan dalam transaksi database serializable. Aksi edit listing tidak boleh mengubah status transaksi. Hapus produk adalah soft-delete (`BANNED`) agar referensi dan riwayat tetap ada; produk yang sedang direservasi tidak dapat dihapus.

## Acceptance criteria

- [ ] Filter katalog hanya mengirim `codZoneId` atau tanpa filter; pilihan titik cocok dengan daftar Safe Zone aktif.
- [ ] Form listing dan edit menyimpan `codZoneId` serta `campusName` dari titik COD yang dipilih.
- [ ] Pembeli tidak bisa meminta produk sendiri atau produk yang sudah tidak `ACTIVE`.
- [ ] Penjual menerima/menolak permintaan; hanya satu transaksi dapat mereservasi produk pada satu waktu.
- [ ] Kontak tidak dikirim atau ditampilkan sebelum permintaan diterima.
- [ ] Reservasi berlaku 24 jam; pembatalan/kedaluwarsa mengaktifkan kembali produk.
- [ ] Pembayaran barang tetap langsung antarpihak dan tidak memengaruhi status pembayaran biaya listing.
- [ ] `SOLD` hanya terjadi setelah kedua pihak mengonfirmasi serah-terima.
- [ ] Ulasan hanya dapat dibuat oleh pembeli transaksi yang selesai.
- [ ] Penghapusan admin tidak menghapus produk yang memiliki riwayat transaksi secara permanen.

## Status penerapan database

Baseline lokal `0_init` dibuat dari introspeksi read-only database Supabase. Baseline memuat tabel yang sudah ada (termasuk `visitor_logs`), mengecualikan `marketplace_transactions`, dan mempertahankan RLS yang aktif; saat introspeksi tidak ditemukan policy. Baseline **belum ditandai applied** dan migrasi `20261118000000_marketplace_transactions` **belum diterapkan**.

`DATABASE_URL` digunakan aplikasi; `DIRECT_URL` digunakan Prisma CLI dan menunjuk ke Supabase session pooler (port 5432). Setelah meninjau baseline dan membuat backup, tandai baseline dengan `npx prisma migrate resolve --applied 0_init`, cek `npx prisma migrate status`, lalu jalankan `npx prisma migrate deploy`. Jangan gunakan `prisma db push` pada database ini.
