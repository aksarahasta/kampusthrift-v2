# CLAUDE.md - Context & Project Guidelines for Kampus Thrift

## 1. Project Overview & Business Core
**Kampus Thrift** is a hyperlocal C2C preloved marketplace designed specifically for university students and nearby communities (1–5 km radius).

### Core Business Logic & Rules:
1. **Dynamic Price Markup Engine**:
   - Sellers input the base price ($P_{base}$).
   - Platform applies an admin-defined markup ($M_{admin}$):  
     $$P_{display} = P_{base} + M_{admin}$$
   - $P_{display}$ is shown to buyers. Sellers receive $P_{base}$ upon sale.
2. **User Roles & Benefits**:
   - **Unified User Account**: Single account with a toggle between "Buyer Mode" and "Seller Mode".
   - **Student Verification**: Domain detection for `.ac.id` + OTP Email verification grants the **Verified Student Badge** and unlocks the **Barter Feature**.
   - **General Public**: Can buy/sell with cash, but no barter privileges or student badge.
   - **Admin**: Dedicated role for content moderation, user suspension, markup configuration, and COD zone management.
3. **Media & Listing Rules**:
   - Creating a listing **requires at least 1 image and 1 video proof** of condition.
   - Listings default to `ACTIVE` status upon valid form submission.
4. **Hyperlocal COD & Communication**:
   - Transactions use campus **COD Safe Zones** with Rp0 shipping fee.
   - Initial buyer-seller interaction generates a pre-filled WhatsApp link.
5. **Honesty Score**:
   - Post-transaction ratings (1–5 stars) aggregate into the seller's profile reputation.

---

## 2. Tech Stack Architecture (Solo-Developer Stack)
- **Framework**: Next.js 14+ (App Router, React, TypeScript)
- **Styling & UI**: Tailwind CSS, Shadcn UI, Lucide Icons
- **Database**: PostgreSQL (Supabase / Neon)
- **ORM & Type Safety**: Prisma ORM (Auto-migrations & auto TypeScript types)
- **Form & Validation**: React Hook Form + Zod (Shared schemas FE/BE)
- **Media Storage**: Supabase Storage (Buckets for images and videos)
- **Authentication**: NextAuth.js / Supabase Auth (Email OTP support)

---

## 3. Directory Structure Standards
```text
kampus-thrift/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth routes (login, register, otp)
│   ├── (dashboard)/          # Seller/User dashboard
│   ├── (marketplace)/        # Public catalog, item detail, search
│   ├── admin/                # Admin control panel
│   ├── api/                  # API Route Handlers
│   ├── layout.tsx
│   └── page.tsx              # Landing Page
├── components/               # React Components
│   ├── ui/                   # Shadcn UI primitives
│   ├── shared/               # Navbar, Footer, Badges
│   └── cards/                # Product Cards, Review Cards
├── lib/                      # Utility functions & clients
│   ├── prisma.ts             # Prisma Client singleton
│   ├── utils.ts              # Helper functions (currency format, markup calc)
│   └── validations/          # Zod validation schemas
├── prisma/
│   └── schema.prisma         # Single Source of Truth for Database
├── public/                   # Static assets
└── types/                    # Extended TypeScript declarations
```

---

## 4. Coding Standards & Conventions

### TypeScript & Rules:
- Always use **strict TypeScript**. Avoid using `any`.
- Derive frontend types directly from Prisma types or Zod schemas.

### Database & Prisma Rules:
- All database modifications MUST go through Prisma schema (`prisma/schema.prisma`) and migrations (`npx prisma migrate dev`).
- Keep model field names in `camelCase` and table mappings in `snake_case` (`@@map`).

### Next.js & React Rules:
- Prefer **Server Components (RSC)** by default. Use `"use client"` only for interactive components (forms, modal state, client-side filters).
- Use **Server Actions** or Zod-validated Route Handlers for mutations.

### Financial Math Rule:
- Always parse and calculate price markup using strict integer operations or utility functions to avoid floating-point rounding errors:
```typescript
export function calculateDisplayPrice(basePrice: number, markupPercentage: number, fixedFee: number): number {
  const markup = Math.round((basePrice * markupPercentage) / 100) + fixedFee;
  return basePrice + markup;
}
```

---

## 5. Environment Variables Setup
Ensure the following variables exist in `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kampusthrift"
NEXTAUTH_SECRET="your-super-secret-key"
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
ADMIN_MARKUP_PERCENTAGE="5"
ADMIN_FIXED_FEE="1000"
```