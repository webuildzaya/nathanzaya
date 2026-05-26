# Zaya

A management platform for small and mid-sized Nigerian driving schools. Zaya replaces paper-based operations with a single web platform — student registration, lesson scheduling, payment tracking, automated WhatsApp notifications, and a real-time admin dashboard.

---

## Overview

Nigerian driving schools run entirely on paper. Student records get lost, instructors miss bookings, cash payments go untracked, and school owners have no visibility into how their business is performing. Zaya solves all of that.

Built specifically for how Nigerian schools operate — Android phones, slow mobile data, non-technical staff, and cash/bank transfer payments.

**Four user roles:**

- **Super Admin** — full access to students, payments, schedules, and reports
- **Staff / Receptionist** — registers students, records payments, books lessons
- **Instructor** — views their own schedule and assigned students
- **Student** — accesses a mobile-first portal via WhatsApp magic link, no password required

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 15 (App Router)                     |
| Language      | TypeScript                                  |
| Styling       | Tailwind CSS                                |
| Database      | PostgreSQL (Supabase)                       |
| ORM           | Prisma                                      |
| Auth          | NextAuth.js v5 + custom magic-link          |
| Server state  | TanStack Query v5                           |
| Client state  | Zustand                                     |
| Notifications | WhatsApp Cloud API + Africa's Talking (SMS) |
| File storage  | Vercel Blob                                 |
| Deployment    | Vercel                                      |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL database (local or [Supabase](https://supabase.com))

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Fill in your environment variables
# See .env.example for all required values

# Run database migrations
bun run db:migrate

# In Supabase SQL Editor, run:
# prisma/migrations/rls/enable_rls.sql

# Seed the database
bun run db:seed

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

| Variable                   | Description                             |
| -------------------------- | --------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string            |
| `NEXTAUTH_SECRET`          | Secret for NextAuth session signing     |
| `NEXTAUTH_URL`             | Base URL of the app                     |
| `BLOB_READ_WRITE_TOKEN`    | Vercel Blob token for file uploads      |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API phone number ID |
| `WHATSAPP_ACCESS_TOKEN`    | Meta WhatsApp Cloud API access token    |
| `AFRICASTALKING_API_KEY`   | Africa's Talking API key (SMS fallback) |
| `AFRICASTALKING_USERNAME`  | Africa's Talking username               |

---

## Scripts

```bash
bun run dev           # Start development server
bun run build         # Production build
bun run start         # Start production server
bun run lint          # Run ESLint
bun run type-check    # Run TypeScript compiler check
bun run test          # Run tests
bun run db:migrate    # Create and run a Prisma migration
bun run db:seed       # Seed the database with test data
bun run db:studio     # Open Prisma Studio
```

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/          # Super admin dashboard and reports
│   ├── (staff)/          # Staff-facing student and payment management
│   ├── (instructor)/     # Instructor schedule view
│   ├── (student)/        # Student mobile portal (magic-link access)
│   └── api/              # API route handlers
├── components/
│   ├── ui/               # Base UI primitives (shadcn/ui)
│   └── [feature]/        # Feature-specific components
├── hooks/                # React Query data hooks
├── lib/
│   ├── auth/             # Auth utilities and RBAC
│   ├── db/               # Prisma client
│   └── notifications/    # WhatsApp and SMS dispatch
├── stores/               # Zustand client state
└── types/                # Shared TypeScript types
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Development seed data
```

---

## License

Private. All rights reserved.
