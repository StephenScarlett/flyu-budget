# FLYU Orlando 2027 — Trip Budget App

A shared, real-time trip budget planner for 7 friends traveling from Trinidad & Tobago to Orlando, Florida.

## Tech Stack

- **Next.js 14+** (App Router) — framework
- **TypeScript** — type safety
- **Tailwind CSS** — styling
- **Supabase** — PostgreSQL database + real-time subscriptions
- **Vercel** — hosting (free tier)

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier)
2. Go to **SQL Editor** → run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **SQL Editor** → run the contents of `supabase/seed.sql`
4. Go to **Settings → API** → copy the **Project URL** and **anon public key**

### 2. Configure Environment

Copy your Supabase credentials into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run

```bash
cd flyu-budget
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 4. Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo to Vercel for automatic deployments. Set the environment variables in the Vercel dashboard.

## Features

- **Overview** — 3 tier summary cards (Budget/Balanced/Premium) with per-person totals in USD + TTD
- **All Costs** — filterable, sortable table with inline editing. Click any price to change it.
- **Compare Tiers** — side-by-side breakdown + feature inclusion matrix
- **Itinerary** — day-by-day plan (Day 1–7) with editable descriptions
- **Savings Plan** — auto-calculated monthly savings per tier + payment milestones
- **Tips & Links** — money-saving tips and direct booking links

## Real-Time Sync

When one person edits a price, everyone sees the change instantly via Supabase Realtime. No refresh needed.

## Project Structure

```
src/
  app/
    layout.tsx          # Root layout
    page.tsx            # Main page (all tabs)
  components/
    layout/             # Header, TabNav
    overview/           # TierCard, GroupTotal, RateInput
    costs/              # CostTable, EditableCell
    compare/            # CompareTable, FeatureMatrix
    itinerary/          # Timeline
    savings/            # SavingsTab
    tips/               # TipsTab
  hooks/                # useTrip, useBudgetItems, useItinerary
  lib/
    supabase/           # client, server, types
    calculations.ts     # Tier math, currency conversion
    constants.ts        # Categories, tiers, tabs config
supabase/
  migrations/           # SQL schema
  seed.sql              # Initial budget data
```
