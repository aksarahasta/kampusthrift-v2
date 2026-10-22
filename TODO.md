# Project Execution Roadmap: Kampus Thrift

## Phase 1: Environment & Project Setup
- [x] **1.1** Initialize Next.js project with TypeScript, App Router, and Tailwind CSS.
- [x] **1.2** Install and configure Shadcn UI library.
- [x] **1.3** Set up Prisma ORM and connect to PostgreSQL database (Supabase/Local).
- [x] **1.4** Configure environment variables (`.env.local`).
- [ ] **1.5** Set up Cloudinary / Supabase Storage bucket for image & video uploads.

---

## Phase 2: Database Schema & Authentication
- [x] **2.1** Define Prisma models in `schema.prisma`:
  - `User` (with `role`, `isVerifiedStudent`, `honestyScore`)
  - `Product` (with `basePrice`, `displayPrice`, `isBarter`, `conditionPercent`, `status`)
  - `ProductMedia` (`url`, `type`: IMAGE/VIDEO)
  - `CodZone` (`campusName`, `locationName`)
  - `Review` (`score`, `comment`)
  - `SystemConfig` (`markupPercentage`, `fixedFee`)
- [ ] **2.2** Run initial Prisma migration (`npx prisma migrate dev --name init`).
- [x] **2.3** Implement User Authentication (Email/Password + OTP Verification for `.ac.id` domain).
- [x] **2.4** Implement `Verified Student Badge` assignment logic upon successful `.ac.id` OTP verification.

---

## Phase 3: Core Marketplace & Listing Engine
- [x] **3.1** Build Admin Markup Utility function ($P_{display} = P_{base} + M_{admin}$).
- [x] **3.2** Create Product Listing Form (Seller Mode):
  - Category & Condition (%) selectors
  - Toggle for Barter Mode (optional target item text)
  - Dropdown for Campus & COD Safe Zones
  - Mandatory file upload validator (At least 1 Photo + 1 Video)
- [x] **3.3** Create Product Catalog / Shop Page:
  - Radius filter (1 km – 5 km)
  - Category and Barter filters
  - "Verified Student Only" toggle
- [x] **3.4** Create Product Detail Page:
  - Video player for condition proof
  - Price display ($P_{display}$)
  - Seller profile card showing **Honesty Score** and **Verified Student Badge**
  - Dynamic "Hubungi via WhatsApp" button with pre-filled transaction message.

---

## Phase 4: Transaction Flow & Reputation System
- [x] **4.1** Implement "Mark as Sold" action in Seller Dashboard.
- [x] **4.2** Create Post-Transaction Rating modal for buyers to submit **Honesty Score** (1–5 stars) and review text.
- [x] **4.3** Build Seller Profile Page displaying aggregated Honesty Score and transaction history.

---

## Phase 5: Admin Panel & Moderation
- [x] **5.1** Build Admin Dashboard with platform stats.
- [x] **5.2** Build Admin Price Markup Configuration settings.
- [x] **5.3** Build Content Moderation module (Take down illegal listings / BAN status).
- [x] **5.4** Build COD Safe Zone Management (CRUD for campus meeting spots).

---

## Phase 6: Testing, Optimization & Deployment
- [ ] **6.1** Optimize video compression and lazy loading for high performance.
- [ ] **6.2** Mobile responsiveness audit across all screen breakpoints.
- [ ] **6.3** Deploy application to Vercel.
- [ ] **6.4** Run production database migrations and seed default COD Safe Zones & System Config.