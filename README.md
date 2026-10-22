# Kampus Thrift

> **Hyperlocal C2C Preloved Marketplace untuk Ekosistem Kampus**

Platform marketplace hyperlocal yang menghubungkan mahasiswa dan masyarakat sekitar kampus (radius 1–5 km) untuk transaksi jual-beli dan tukar-menukar (barter) barang preloved dengan sistem COD aman tanpa ongkos kirim.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi dengan OTP** — Registrasi & verifikasi email kampus (.ac.id) untuk Verified Student Badge
- 💰 **Dynamic Price Markup Engine** — Transparansi harga $P_{display} = P_{base} + M_{admin}$
- 🎓 **Verified Student Badge** — Akses eksklusif fitur Barter untuk mahasiswa terverifikasi
- 📹 **Video Bukti Kondisi Wajib** — Minimal 1 foto + 1 video untuk setiap listing
- 📍 **COD Safe Zones** — Titik temu aman di kampus dengan Rp 0 ongkir
- ⭐ **Honesty Score System** — Rating reputasi penjual 1–5 bintang
- 🔄 **Fitur Barter** — Khusus mahasiswa terverifikasi
- 📱 **Mobile-First Responsive Design** — Optimal untuk smartphone
- 🛡️ **Admin Panel Lengkap** — Moderasi konten, manajemen markup, dan COD zones

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd KampusThrift_V2
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# NextAuth.js
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Admin Markup (Default)
ADMIN_MARKUP_PERCENTAGE="5"
ADMIN_FIXED_FEE="1000"

# Email OTP (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Setup Database

**Option A: Menggunakan Prisma CLI**

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed default data (Admin, COD Zones, System Config)
npm run db:seed
```

**Option B: Menggunakan SQL langsung di Supabase**

1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `prisma/migrations/init.sql`
3. Execute
4. Jalankan seed: `npm run db:seed`

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Proyek

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register, verify-otp)
│   ├── admin/                    # Admin control panel
│   ├── products/                 # Product listing & detail pages
│   ├── users/                    # User profile pages
│   ├── api/                      # API Route Handlers
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Shadcn UI primitives
│   ├── shared/                   # Shared components (Nav, Badges)
│   └── cards/                    # Card components (Product, Review)
├── lib/
│   ├── prisma.ts                 # Prisma Client singleton
│   ├── auth.ts                   # NextAuth configuration
│   ├── mail.ts                   # Email OTP sender
│   ├── media.ts                  # Video/image optimization
│   ├── utils.ts                  # Helper functions
│   └── validations/              # Zod validation schemas
├── types/                        # TypeScript declarations
└── public/                       # Static assets
```

---

## 🗄️ Skema Database

### Models Utama

| Model | Deskripsi |
|-------|-----------|
| **User** | Akun pengguna dengan `role` (USER/ADMIN), `isVerifiedStudent`, `honestyScore` |
| **Product** | Listing barang dengan `basePrice`, `displayPrice`, `isBarter`, `conditionPercentage`, `status` |
| **ProductMedia** | Media produk (IMAGE/VIDEO) dengan `isPrimary` flag |
| **CodZone** | Titik temu aman di kampus |
| **Review** | Ulasan penjual dengan `score` (1-5) dan `comment` |
| **SystemConfig** | Konfigurasi global markup (`markupPercentage`, `fixedFee`) |
| **OtpVerification** | Kode OTP untuk verifikasi email |

---

## 🔐 Akun Default (setelah seed)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@kampusthrift.id | Admin1234! |
| **Student (Verified)** | budi.santoso@ui.ac.id | Student1234! |
| **Public User** | warga.sekitar@gmail.com | Public1234! |

---

## 🌐 Deployment ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "Initial commit - Kampus Thrift MVP"
git push origin main
```

### 2. Deploy di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Import repository dari GitHub
3. Configure Environment Variables (copy dari `.env.local`)
4. Deploy

### 3. Post-Deployment

1. Set `NEXTAUTH_URL` ke domain Vercel (e.g., `https://kampus-thrift.vercel.app`)
2. Run migration di production database:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

---

## 📱 Mobile Responsiveness

Aplikasi ini dirancang dengan **Mobile-First** approach:

- ✅ Bottom navigation bar untuk smartphone
- ✅ Responsive grid 2–5 kolom untuk katalog produk
- ✅ Touch-friendly buttons dan forms
- ✅ Optimized media loading (lazy loading, compression)

---

## ⚡ Performance Optimizations

- **Image Compression**: Client-side compression sebelum upload (max 1200x1200px, JPEG 80% quality)
- **Video Validation**: Duration check (5-60s), file size limit (50MB), format validation (MP4/WebM)
- **Lazy Loading**: Images dan videos di-load saat visible
- **Code Splitting**: Dynamic imports untuk komponen berat

---

## 🔧 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

---

## 📚 Dokumentasi

- [PRD.md](docs/PRD.md) — Product Requirement Document
- [SRS.md](docs/SRS.md) — Software Requirements Specification
- [claude.md](claude.md) — Technical guidelines

---

## 🛡️ Security

- Password di-hash dengan bcrypt (salt factor 10)
- OTP berlaku 5 menit
- Role-based access control untuk Admin Panel
- Input validation dengan Zod di frontend & backend

---

## 📄 License

MIT License © 2026 Kampus Thrift Team

---

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

---

**Built with ❤️ for Indonesian University Students**
