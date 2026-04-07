# AMC A-List Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA that tracks AMC A-List movie-going and calculates membership savings over custom time ranges, with Letterboxd integration and a friend simulator.

**Architecture:** Next.js App Router with Tailwind CSS for a dark-themed mobile-first UI. Supabase handles auth and Postgres storage. Letterboxd data comes via RSS feed parsing. TMDB API provides movie search/autocomplete. Savings logic is a pure function layer that computes ticket values and break-even from the movies + pricing config.

**Tech Stack:** Next.js 14+, Tailwind CSS, Supabase (Postgres + Auth), TMDB API, Letterboxd RSS, Vercel deployment

---

## File Structure

```
amc_alist_tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout, dark theme, font loading
│   │   ├── page.tsx                      # Home dashboard (protected)
│   │   ├── globals.css                   # Tailwind imports + custom styles
│   │   ├── manifest.ts                   # PWA web manifest (dynamic route)
│   │   ├── login/page.tsx                # Auth page (magic link)
│   │   ├── sync/page.tsx                 # Sync tab (protected)
│   │   ├── stats/page.tsx                # Stats tab (protected)
│   │   ├── simulate/page.tsx             # Simulate tab (public, no auth)
│   │   ├── settings/page.tsx             # Settings (protected)
│   │   └── api/
│   │       ├── letterboxd/route.ts       # Letterboxd RSS proxy (avoids CORS)
│   │       └── tmdb/search/route.ts      # TMDB search proxy (hides API key)
│   ├── components/
│   │   ├── bottom-nav.tsx                # Tab bar navigation
│   │   ├── time-range-pills.tsx          # Scrollable time range selector
│   │   ├── savings-hero.tsx              # Big net savings number
│   │   ├── break-even-card.tsx           # You Paid vs Ticket Value side-by-side
│   │   ├── quick-stats.tsx               # 3 stat cards row
│   │   ├── movie-list.tsx                # Scrollable movie list
│   │   ├── movie-row.tsx                 # Single movie row
│   │   ├── bottom-sheet.tsx              # Reusable bottom sheet drawer
│   │   ├── movie-triage-sheet.tsx        # Bottom sheet content for categorizing a movie
│   │   ├── movie-search.tsx              # TMDB-powered search autocomplete
│   │   ├── savings-chart.tsx             # Cumulative savings line chart
│   │   ├── monthly-breakdown.tsx         # Monthly bar chart
│   │   ├── letterboxd-insights.tsx       # Rating comparison + distribution
│   │   ├── format-location-stats.tsx     # Format counts + location visits
│   │   └── simulator-form.tsx            # Multi-step simulator wizard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # createBrowserClient helper
│   │   │   ├── server.ts                 # createServerClient helper
│   │   │   └── middleware.ts             # Auth middleware for protected routes
│   │   ├── savings.ts                    # Pure savings calculation functions
│   │   ├── letterboxd.ts                 # RSS feed parser
│   │   ├── tmdb.ts                       # TMDB API wrapper
│   │   ├── types.ts                      # Shared TypeScript types
│   │   └── constants.ts                  # Default pricing, format list, etc.
│   └── hooks/
│       ├── use-movies.ts                 # Fetch/mutate movies from Supabase
│       ├── use-settings.ts               # Fetch/mutate user settings + pricing
│       └── use-time-range.ts             # Time range state + date calculations
├── supabase/
│   └── migrations/
│       └── 20260406000000_initial_schema.sql
├── __tests__/
│   ├── lib/
│   │   ├── savings.test.ts
│   │   └── letterboxd.test.ts
│   └── components/
│       └── simulator-form.test.tsx
├── public/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── package.json
├── tsconfig.json
├── middleware.ts                          # Next.js middleware (delegates to supabase middleware)
└── .env.local.example
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/jalaj.singh/Downloads/amc_alist_tracker
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Accept overwrite prompts — the existing files (docs/) will be preserved.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom ts-jest @types/jest
```

- [ ] **Step 3: Create Jest config**

Create `jest.config.ts`:

```typescript
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
```

Create `jest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Create .env.local.example**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TMDB_API_KEY=your-tmdb-api-key
```

- [ ] **Step 5: Configure Tailwind for dark theme**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#111111",
        card: "#1a1a2e",
        "card-alt": "#16213e",
        accent: "#4ade80",
        "accent-red": "#f87171",
        "accent-yellow": "#fbbf24",
        "accent-cyan": "#22d3ee",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Set up globals.css**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-surface text-white antialiased;
}
```

- [ ] **Step 7: Set up root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMC Tracker",
  description: "Track your AMC A-List savings",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder home page**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">AMC Tracker</h1>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
```

- [ ] **Step 9: Verify it runs**

```bash
npm run dev
```

Expected: App runs at localhost:3000, dark background, "AMC Tracker" + "Coming soon" text.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind dark theme"
```

---

## Task 2: Supabase Schema + Migration

**Files:**
- Create: `supabase/migrations/20260406000000_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260406000000_initial_schema.sql`:

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  letterboxd_username text,
  membership_cost decimal(6,2) not null default 25.99,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- AMC Locations
create table public.amc_locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.amc_locations enable row level security;

create policy "Users can manage own locations"
  on public.amc_locations for all using (auth.uid() = user_id);

-- Format Pricing
create type public.movie_format as enum (
  'standard', 'imax', 'dolby_cinema', '3d', 'prime', 'screenx'
);

create table public.format_pricing (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  format public.movie_format not null,
  regular_price decimal(6,2) not null,
  discount_price decimal(6,2) not null,
  created_at timestamptz not null default now(),
  unique(user_id, format)
);

alter table public.format_pricing enable row level security;

create policy "Users can manage own pricing"
  on public.format_pricing for all using (auth.uid() = user_id);

-- Seed default pricing on profile creation
create or replace function public.seed_default_pricing()
returns trigger as $$
begin
  insert into public.format_pricing (user_id, format, regular_price, discount_price) values
    (new.id, 'standard', 15.99, 8.00),
    (new.id, 'imax', 22.99, 11.50),
    (new.id, 'dolby_cinema', 22.99, 11.50);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed_pricing
  after insert on public.profiles
  for each row execute function public.seed_default_pricing();

-- Discount Days
create table public.discount_days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  unique(user_id, day_of_week)
);

alter table public.discount_days enable row level security;

create policy "Users can manage own discount days"
  on public.discount_days for all using (auth.uid() = user_id);

-- Seed default discount days on profile creation
create or replace function public.seed_default_discount_days()
returns trigger as $$
begin
  insert into public.discount_days (user_id, day_of_week) values
    (new.id, 2),  -- Tuesday
    (new.id, 3);  -- Wednesday
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed_discount_days
  after insert on public.profiles
  for each row execute function public.seed_default_discount_days();

-- Movies
create type public.venue_type as enum ('amc', 'other_theater', 'home');
create type public.movie_source as enum ('letterboxd_sync', 'manual');

create table public.movies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  tmdb_id integer,
  watched_date date not null,
  venue_type public.venue_type not null,
  amc_location_id uuid references public.amc_locations(id) on delete set null,
  format public.movie_format,
  is_discount_day boolean not null default false,
  ticket_value decimal(6,2),
  letterboxd_rating decimal(3,1),
  letterboxd_avg_rating decimal(3,1),
  letterboxd_url text,
  source public.movie_source not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;

create policy "Users can manage own movies"
  on public.movies for all using (auth.uid() = user_id);

-- Index for common queries
create index movies_user_date_idx on public.movies(user_id, watched_date desc);
create index movies_user_venue_idx on public.movies(user_id, venue_type);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migration with RLS and auto-seeding"
```

Note: This migration is applied via the Supabase dashboard (SQL editor) or `supabase db push` if using the CLI. The engineer should create a Supabase project first and copy the URL + anon key to `.env.local`.

---

## Task 3: Supabase Client + Auth Middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `middleware.ts`, `src/app/login/page.tsx`

- [ ] **Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create auth middleware**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow simulate page without auth
  if (request.nextUrl.pathname.startsWith("/simulate")) {
    return supabaseResponse;
  }

  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create Next.js middleware entry**

Create `middleware.ts` (project root):

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Create login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">AMC Tracker</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Track your A-List savings
        </p>

        {sent ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-accent font-semibold mb-2">Check your email</p>
            <p className="text-gray-400 text-sm">
              We sent a login link to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-card border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            {error && <p className="text-accent-red text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent text-black font-bold py-3 rounded-xl"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/ middleware.ts src/app/login/
git commit -m "feat: add Supabase auth with magic link login"
```

---

## Task 4: Types + Constants

**Files:**
- Create: `src/lib/types.ts`, `src/lib/constants.ts`

- [ ] **Step 1: Create shared types**

Create `src/lib/types.ts`:

```typescript
export type VenueType = "amc" | "other_theater" | "home";
export type MovieSource = "letterboxd_sync" | "manual";
export type MovieFormat =
  | "standard"
  | "imax"
  | "dolby_cinema"
  | "3d"
  | "prime"
  | "screenx";

export interface Movie {
  id: string;
  user_id: string;
  title: string;
  tmdb_id: number | null;
  watched_date: string; // YYYY-MM-DD
  venue_type: VenueType;
  amc_location_id: string | null;
  format: MovieFormat | null;
  is_discount_day: boolean;
  ticket_value: number | null;
  letterboxd_rating: number | null;
  letterboxd_avg_rating: number | null;
  letterboxd_url: string | null;
  source: MovieSource;
  created_at: string;
  // Joined fields
  amc_location?: AmcLocation;
}

export interface AmcLocation {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FormatPricing {
  id: string;
  user_id: string;
  format: MovieFormat;
  regular_price: number;
  discount_price: number;
}

export interface DiscountDay {
  id: string;
  user_id: string;
  day_of_week: number;
}

export interface Profile {
  id: string;
  email: string;
  letterboxd_username: string | null;
  membership_cost: number;
  created_at: string;
}

export interface LetterboxdEntry {
  title: string;
  watched_date: string;
  rating: number | null;
  letterboxd_url: string;
}

export type TimeRange =
  | "this_month"
  | "90_days"
  | "ytd"
  | "all_time"
  | { from: string; to: string };

export interface SavingsSummary {
  total_ticket_value: number;
  membership_cost: number;
  net_savings: number;
  movie_count: number;
  avg_rating: number | null;
  avg_ticket_value: number;
}
```

- [ ] **Step 2: Create constants**

Create `src/lib/constants.ts`:

```typescript
import type { MovieFormat } from "./types";

export const DEFAULT_MEMBERSHIP_COST = 25.99;

export const DEFAULT_PRICING: {
  format: MovieFormat;
  regular_price: number;
  discount_price: number;
}[] = [
  { format: "standard", regular_price: 15.99, discount_price: 8.0 },
  { format: "imax", regular_price: 22.99, discount_price: 11.5 },
  { format: "dolby_cinema", regular_price: 22.99, discount_price: 11.5 },
];

export const DEFAULT_DISCOUNT_DAYS = [2, 3]; // Tuesday, Wednesday

export const FORMAT_LABELS: Record<MovieFormat, string> = {
  standard: "Standard",
  imax: "IMAX",
  dolby_cinema: "Dolby Cinema",
  "3d": "3D",
  prime: "Prime",
  screenx: "ScreenX",
};

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add shared types and constants"
```

---

## Task 5: Savings Calculation Logic (TDD)

**Files:**
- Create: `src/lib/savings.ts`, `__tests__/lib/savings.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/savings.test.ts`:

```typescript
import {
  calculateTicketValue,
  calculateSavings,
  prorateMembershipCost,
} from "@/lib/savings";
import type { Movie, FormatPricing } from "@/lib/types";

const pricing: FormatPricing[] = [
  {
    id: "1",
    user_id: "u1",
    format: "standard",
    regular_price: 15.99,
    discount_price: 8.0,
  },
  {
    id: "2",
    user_id: "u1",
    format: "imax",
    regular_price: 22.99,
    discount_price: 11.5,
  },
  {
    id: "3",
    user_id: "u1",
    format: "dolby_cinema",
    regular_price: 22.99,
    discount_price: 11.5,
  },
];

describe("calculateTicketValue", () => {
  it("returns regular price for non-discount day", () => {
    expect(calculateTicketValue("imax", false, pricing)).toBe(22.99);
  });

  it("returns discount price for discount day", () => {
    expect(calculateTicketValue("imax", true, pricing)).toBe(11.5);
  });

  it("returns standard price for standard format", () => {
    expect(calculateTicketValue("standard", false, pricing)).toBe(15.99);
  });

  it("returns 0 if format not found in pricing", () => {
    expect(calculateTicketValue("3d", false, pricing)).toBe(0);
  });

  it("returns 0 for null format", () => {
    expect(calculateTicketValue(null, false, pricing)).toBe(0);
  });
});

describe("calculateSavings", () => {
  const makeMovie = (overrides: Partial<Movie>): Movie => ({
    id: "m1",
    user_id: "u1",
    title: "Test",
    tmdb_id: null,
    watched_date: "2026-04-01",
    venue_type: "amc",
    amc_location_id: null,
    format: "standard",
    is_discount_day: false,
    ticket_value: 15.99,
    letterboxd_rating: 4.0,
    letterboxd_avg_rating: 3.5,
    letterboxd_url: null,
    source: "manual",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  });

  it("calculates total ticket value from AMC movies only", () => {
    const movies = [
      makeMovie({ ticket_value: 15.99 }),
      makeMovie({ ticket_value: 22.99 }),
      makeMovie({ venue_type: "home", ticket_value: null }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.total_ticket_value).toBe(38.98);
  });

  it("calculates net savings as ticket value minus membership", () => {
    const movies = [
      makeMovie({ ticket_value: 15.99 }),
      makeMovie({ ticket_value: 22.99 }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.net_savings).toBeCloseTo(12.99, 2);
  });

  it("returns negative net savings when below break-even", () => {
    const movies = [makeMovie({ ticket_value: 15.99 })];
    const result = calculateSavings(movies, 25.99);
    expect(result.net_savings).toBeCloseTo(-10.0, 2);
  });

  it("counts only AMC movies", () => {
    const movies = [
      makeMovie({ venue_type: "amc" }),
      makeMovie({ venue_type: "home" }),
      makeMovie({ venue_type: "other_theater" }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.movie_count).toBe(1);
  });

  it("calculates average rating from AMC movies with ratings", () => {
    const movies = [
      makeMovie({ letterboxd_rating: 4.0 }),
      makeMovie({ letterboxd_rating: 5.0 }),
      makeMovie({ letterboxd_rating: null }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_rating).toBe(4.5);
  });

  it("returns null avg_rating when no movies have ratings", () => {
    const movies = [makeMovie({ letterboxd_rating: null })];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_rating).toBeNull();
  });

  it("calculates average ticket value", () => {
    const movies = [
      makeMovie({ ticket_value: 15.99 }),
      makeMovie({ ticket_value: 22.99 }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_ticket_value).toBeCloseTo(19.49, 2);
  });

  it("handles empty movie list", () => {
    const result = calculateSavings([], 25.99);
    expect(result.total_ticket_value).toBe(0);
    expect(result.net_savings).toBe(-25.99);
    expect(result.movie_count).toBe(0);
    expect(result.avg_rating).toBeNull();
    expect(result.avg_ticket_value).toBe(0);
  });
});

describe("prorateMembershipCost", () => {
  it("returns full cost for a complete month", () => {
    // April 2026 has 30 days
    expect(prorateMembershipCost(25.99, "2026-04-01", "2026-04-30")).toBeCloseTo(
      25.99,
      2
    );
  });

  it("prorates for partial month (15 of 30 days)", () => {
    expect(prorateMembershipCost(25.99, "2026-04-01", "2026-04-15")).toBeCloseTo(
      12.995,
      1
    );
  });

  it("handles multi-month ranges", () => {
    // Jan 1 - Mar 31 = 3 full months
    expect(prorateMembershipCost(25.99, "2026-01-01", "2026-03-31")).toBeCloseTo(
      77.97,
      2
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/savings.test.ts --verbose
```

Expected: All tests FAIL — modules not found.

- [ ] **Step 3: Implement savings functions**

Create `src/lib/savings.ts`:

```typescript
import type { Movie, MovieFormat, FormatPricing, SavingsSummary } from "./types";

export function calculateTicketValue(
  format: MovieFormat | null,
  isDiscountDay: boolean,
  pricing: FormatPricing[]
): number {
  if (!format) return 0;
  const formatPricing = pricing.find((p) => p.format === format);
  if (!formatPricing) return 0;
  return isDiscountDay ? formatPricing.discount_price : formatPricing.regular_price;
}

export function calculateSavings(
  movies: Movie[],
  membershipCost: number
): SavingsSummary {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");

  const totalTicketValue = amcMovies.reduce(
    (sum, m) => sum + (m.ticket_value ?? 0),
    0
  );

  const ratingsWithValues = amcMovies
    .map((m) => m.letterboxd_rating)
    .filter((r): r is number => r !== null);

  const avgRating =
    ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((a, b) => a + b, 0) / ratingsWithValues.length
      : null;

  const avgTicketValue =
    amcMovies.length > 0 ? totalTicketValue / amcMovies.length : 0;

  return {
    total_ticket_value: totalTicketValue,
    membership_cost: membershipCost,
    net_savings: totalTicketValue - membershipCost,
    movie_count: amcMovies.length,
    avg_rating: avgRating,
    avg_ticket_value: avgTicketValue,
  };
}

export function prorateMembershipCost(
  monthlyCost: number,
  fromDate: string,
  toDate: string
): number {
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T00:00:00");

  let totalCost = 0;
  const current = new Date(from);

  while (current <= to) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    const rangeStart = current > monthStart ? current : monthStart;
    const rangeEnd = to < monthEnd ? to : monthEnd;

    const daysInRange =
      Math.round(
        (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    totalCost += (monthlyCost * daysInRange) / daysInMonth;

    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return totalCost;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/savings.test.ts --verbose
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/savings.ts __tests__/lib/savings.test.ts
git commit -m "feat: add savings calculation logic with tests"
```

---

## Task 6: Letterboxd RSS Parser (TDD)

**Files:**
- Create: `src/lib/letterboxd.ts`, `__tests__/lib/letterboxd.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/letterboxd.test.ts`:

```typescript
import { parseLetterboxdRss } from "@/lib/letterboxd";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:letterboxd="https://letterboxd.com">
  <channel>
    <title>Letterboxd - jalaj</title>
    <item>
      <title>Mission Impossible 8, 2026 - ★★★★½</title>
      <letterboxd:watchedDate>2026-04-04</letterboxd:watchedDate>
      <letterboxd:memberRating>4.5</letterboxd:memberRating>
      <link>https://letterboxd.com/jalaj/film/mission-impossible-8/</link>
      <letterboxd:filmTitle>Mission Impossible 8</letterboxd:filmTitle>
    </item>
    <item>
      <title>Dune: Part Three, 2026 - ★★★★★</title>
      <letterboxd:watchedDate>2026-04-01</letterboxd:watchedDate>
      <letterboxd:memberRating>5.0</letterboxd:memberRating>
      <link>https://letterboxd.com/jalaj/film/dune-part-three/</link>
      <letterboxd:filmTitle>Dune: Part Three</letterboxd:filmTitle>
    </item>
    <item>
      <title>Past Lives, 2023</title>
      <letterboxd:watchedDate>2026-03-30</letterboxd:watchedDate>
      <link>https://letterboxd.com/jalaj/film/past-lives/</link>
      <letterboxd:filmTitle>Past Lives</letterboxd:filmTitle>
    </item>
  </channel>
</rss>`;

describe("parseLetterboxdRss", () => {
  it("parses all entries from RSS feed", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries).toHaveLength(3);
  });

  it("extracts movie title from filmTitle tag", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].title).toBe("Mission Impossible 8");
  });

  it("extracts watched date", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].watched_date).toBe("2026-04-04");
  });

  it("extracts rating when present", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].rating).toBe(4.5);
  });

  it("returns null rating when not present", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[2].rating).toBeNull();
  });

  it("extracts letterboxd URL", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[1].letterboxd_url).toBe(
      "https://letterboxd.com/jalaj/film/dune-part-three/"
    );
  });

  it("returns empty array for empty feed", () => {
    const empty = `<?xml version="1.0"?><rss><channel></channel></rss>`;
    expect(parseLetterboxdRss(empty)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/letterboxd.test.ts --verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement parser**

Create `src/lib/letterboxd.ts`:

```typescript
import type { LetterboxdEntry } from "./types";

export function parseLetterboxdRss(xml: string): LetterboxdEntry[] {
  const entries: LetterboxdEntry[] = [];

  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const filmTitle = extractTag(item, "letterboxd:filmTitle");
    const watchedDate = extractTag(item, "letterboxd:watchedDate");
    const ratingStr = extractTag(item, "letterboxd:memberRating");
    const link = extractTag(item, "link");

    if (!filmTitle || !watchedDate) continue;

    entries.push({
      title: filmTitle,
      watched_date: watchedDate,
      rating: ratingStr ? parseFloat(ratingStr) : null,
      letterboxd_url: link || "",
    });
  }

  return entries;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

export function buildLetterboxdRssUrl(username: string): string {
  return `https://letterboxd.com/${username}/rss/`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/letterboxd.test.ts --verbose
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/letterboxd.ts __tests__/lib/letterboxd.test.ts
git commit -m "feat: add Letterboxd RSS feed parser with tests"
```

---

## Task 7: TMDB Client + API Routes

**Files:**
- Create: `src/lib/tmdb.ts`, `src/app/api/tmdb/search/route.ts`, `src/app/api/letterboxd/route.ts`

- [ ] **Step 1: Create TMDB client**

Create `src/lib/tmdb.ts`:

```typescript
export interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
}

export async function searchMovies(
  query: string,
  apiKey: string
): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).slice(0, 8).map((r: any) => ({
    id: r.id,
    title: r.title,
    release_date: r.release_date || "",
    poster_path: r.poster_path,
  }));
}
```

- [ ] **Step 2: Create TMDB search API route**

Create `src/app/api/tmdb/search/route.ts`:

```typescript
import { searchMovies } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const results = await searchMovies(query, apiKey);
  return NextResponse.json(results);
}
```

- [ ] **Step 3: Create Letterboxd proxy API route**

Create `src/app/api/letterboxd/route.ts`:

```typescript
import { buildLetterboxdRssUrl, parseLetterboxdRss } from "@/lib/letterboxd";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("letterboxd_username")
    .eq("id", user.id)
    .single();

  if (!profile?.letterboxd_username) {
    return NextResponse.json(
      { error: "No Letterboxd username configured" },
      { status: 400 }
    );
  }

  const rssUrl = buildLetterboxdRssUrl(profile.letterboxd_username);
  const res = await fetch(rssUrl);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch Letterboxd feed" },
      { status: 502 }
    );
  }

  const xml = await res.text();
  const entries = parseLetterboxdRss(xml);
  return NextResponse.json(entries);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/tmdb.ts src/app/api/
git commit -m "feat: add TMDB client and API proxy routes"
```

---

## Task 8: Bottom Nav + App Shell

**Files:**
- Create: `src/components/bottom-nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create bottom nav component**

Create `src/components/bottom-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/sync", label: "Sync", icon: "⟳" },
  { href: "/stats", label: "Stats", icon: "▦" },
  { href: "/simulate", label: "Simulate", icon: "⎆" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive ? "text-accent" : "text-gray-600"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add bottom nav to layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMC Tracker",
  description: "Track your AMC A-List savings",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create placeholder pages for each tab**

Create `src/app/sync/page.tsx`:

```tsx
export default function SyncPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Sync</h1>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
```

Create `src/app/stats/page.tsx`:

```tsx
export default function StatsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Stats</h1>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
```

Create `src/app/simulate/page.tsx`:

```tsx
export default function SimulatePage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Simulate</h1>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
```

Create `src/app/settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify navigation works**

```bash
npm run dev
```

Expected: All 4 tabs render with active state highlighting. Clicking between tabs navigates correctly.

- [ ] **Step 5: Commit**

```bash
git add src/components/bottom-nav.tsx src/app/
git commit -m "feat: add bottom nav and placeholder tab pages"
```

---

## Task 9: Time Range Hook + Pills Component

**Files:**
- Create: `src/hooks/use-time-range.ts`, `src/components/time-range-pills.tsx`

- [ ] **Step 1: Create time range hook**

Create `src/hooks/use-time-range.ts`:

```typescript
"use client";

import { useState, useMemo } from "react";
import type { TimeRange } from "@/lib/types";

export function useTimeRange() {
  const [range, setRange] = useState<TimeRange>("this_month");

  const dateRange = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (range === "this_month") {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to: today };
    }

    if (range === "90_days") {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: from.toISOString().split("T")[0], to: today };
    }

    if (range === "ytd") {
      return { from: `${now.getFullYear()}-01-01`, to: today };
    }

    if (range === "all_time") {
      return { from: "2000-01-01", to: today };
    }

    // Custom range
    return range;
  }, [range]);

  return { range, setRange, dateRange };
}
```

- [ ] **Step 2: Create time range pills component**

Create `src/components/time-range-pills.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { TimeRange } from "@/lib/types";

interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const presets: { label: string; value: TimeRange }[] = [
  { label: "This Month", value: "this_month" },
  { label: "90 Days", value: "90_days" },
  { label: "YTD", value: "ytd" },
  { label: "All Time", value: "all_time" },
];

export function TimeRangePills({ value, onChange }: TimeRangePillsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const isCustom = typeof value === "object";
  const activePreset = typeof value === "string" ? value : null;

  function handleCustomApply() {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setShowCustom(false);
              onChange(preset.value);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activePreset === preset.value
                ? "bg-accent text-black"
                : "bg-card text-gray-500"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isCustom ? "bg-accent text-black" : "bg-card text-gray-500"
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2 mt-2 items-center">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="flex-1 bg-card border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white"
          />
          <span className="text-gray-500 text-xs">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="flex-1 bg-card border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white"
          />
          <button
            onClick={handleCustomApply}
            className="bg-accent text-black px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-time-range.ts src/components/time-range-pills.tsx
git commit -m "feat: add time range hook and pills component"
```

---

## Task 10: Data Hooks

**Files:**
- Create: `src/hooks/use-movies.ts`, `src/hooks/use-settings.ts`

- [ ] **Step 1: Create movies hook**

Create `src/hooks/use-movies.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Movie, VenueType, MovieFormat } from "@/lib/types";

export function useMovies(dateRange: { from: string; to: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("movies")
      .select("*, amc_location:amc_locations(id, name)")
      .gte("watched_date", dateRange.from)
      .lte("watched_date", dateRange.to)
      .order("watched_date", { ascending: false });

    setMovies((data as Movie[]) || []);
    setLoading(false);
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  async function addMovie(movie: {
    title: string;
    tmdb_id?: number;
    watched_date: string;
    venue_type: VenueType;
    amc_location_id?: string;
    format?: MovieFormat;
    is_discount_day: boolean;
    ticket_value?: number;
    letterboxd_rating?: number;
    letterboxd_avg_rating?: number;
    letterboxd_url?: string;
    source: "letterboxd_sync" | "manual";
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("movies").insert({
      ...movie,
      user_id: user.id,
    });

    if (!error) await fetchMovies();
    return error;
  }

  async function checkDuplicate(title: string, watchedDate: string) {
    const { data } = await supabase
      .from("movies")
      .select("id")
      .eq("title", title)
      .eq("watched_date", watchedDate)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  return { movies, loading, addMovie, checkDuplicate, refetch: fetchMovies };
}
```

- [ ] **Step 2: Create settings hook**

Create `src/hooks/use-settings.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Profile,
  FormatPricing,
  DiscountDay,
  AmcLocation,
} from "@/lib/types";

export function useSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pricing, setPricing] = useState<FormatPricing[]>([]);
  const [discountDays, setDiscountDays] = useState<DiscountDay[]>([]);
  const [locations, setLocations] = useState<AmcLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, pricingRes, daysRes, locsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("format_pricing").select("*").eq("user_id", user.id),
      supabase.from("discount_days").select("*").eq("user_id", user.id),
      supabase
        .from("amc_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProfile(profileRes.data as Profile);
    setPricing((pricingRes.data as FormatPricing[]) || []);
    setDiscountDays((daysRes.data as DiscountDay[]) || []);
    setLocations((locsRes.data as AmcLocation[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function updateProfile(updates: Partial<Profile>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update(updates).eq("id", user.id);
    await fetch();
  }

  async function updatePricing(
    format: string,
    regularPrice: number,
    discountPrice: number
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("format_pricing")
      .upsert(
        {
          user_id: user.id,
          format,
          regular_price: regularPrice,
          discount_price: discountPrice,
        },
        { onConflict: "user_id,format" }
      );
    await fetch();
  }

  async function addLocation(name: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("amc_locations")
      .insert({ user_id: user.id, name })
      .select()
      .single();

    await fetch();
    return data as AmcLocation;
  }

  async function removeLocation(id: string) {
    await supabase.from("amc_locations").delete().eq("id", id);
    await fetch();
  }

  return {
    profile,
    pricing,
    discountDays,
    locations,
    loading,
    updateProfile,
    updatePricing,
    addLocation,
    removeLocation,
    refetch: fetch,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add movies and settings data hooks"
```

---

## Task 11: Home Dashboard

**Files:**
- Create: `src/components/savings-hero.tsx`, `src/components/break-even-card.tsx`, `src/components/quick-stats.tsx`, `src/components/movie-row.tsx`, `src/components/movie-list.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create savings hero component**

Create `src/components/savings-hero.tsx`:

```tsx
import type { SavingsSummary } from "@/lib/types";

export function SavingsHero({ summary }: { summary: SavingsSummary }) {
  return (
    <div className="text-center py-5 bg-gradient-to-br from-card to-card-alt rounded-xl">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest">
        Total Saved
      </div>
      <div className="text-4xl font-extrabold text-accent mt-1">
        ${summary.total_ticket_value.toFixed(2)}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {summary.movie_count} movie{summary.movie_count !== 1 ? "s" : ""}{" "}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create break-even card component**

Create `src/components/break-even-card.tsx`:

```tsx
import type { SavingsSummary } from "@/lib/types";

export function BreakEvenCard({ summary }: { summary: SavingsSummary }) {
  const isPositive = summary.net_savings >= 0;

  return (
    <div>
      {/* Side-by-side comparison */}
      <div className="flex gap-2.5 mb-3">
        <div className="flex-1 bg-card rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">
            You Paid
          </div>
          <div className="text-2xl font-extrabold text-accent-red mt-1">
            ${summary.membership_cost.toFixed(2)}
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">membership</div>
        </div>
        <div className="flex-1 bg-card rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">
            Ticket Value
          </div>
          <div className="text-2xl font-extrabold text-accent mt-1">
            ${summary.total_ticket_value.toFixed(2)}
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">
            {summary.movie_count} movie{summary.movie_count !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Net savings banner */}
      <div
        className={`rounded-xl p-3 text-center border ${
          isPositive
            ? "bg-green-950/50 border-accent/25"
            : "bg-red-950/50 border-accent-red/25"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className={`text-xs uppercase tracking-wide ${
              isPositive ? "text-green-300" : "text-red-300"
            }`}
          >
            Net Savings
          </span>
          <span
            className={`text-xl font-extrabold ${
              isPositive ? "text-accent" : "text-accent-red"
            }`}
          >
            {isPositive ? "+" : ""}${summary.net_savings.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create quick stats component**

Create `src/components/quick-stats.tsx`:

```tsx
import type { SavingsSummary } from "@/lib/types";

export function QuickStats({ summary }: { summary: SavingsSummary }) {
  return (
    <div className="flex gap-1.5">
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">{summary.movie_count}</div>
        <div className="text-[9px] text-gray-500">Movies</div>
      </div>
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">
          {summary.avg_rating !== null ? summary.avg_rating.toFixed(1) : "—"}
        </div>
        <div className="text-[9px] text-gray-500">Avg Rating</div>
      </div>
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">
          {summary.avg_ticket_value > 0
            ? `$${summary.avg_ticket_value.toFixed(2)}`
            : "—"}
        </div>
        <div className="text-[9px] text-gray-500">Avg Ticket</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create movie row component**

Create `src/components/movie-row.tsx`:

```tsx
import type { Movie } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";

export function MovieRow({ movie }: { movie: Movie }) {
  const locationName = movie.amc_location?.name || "";
  const formatLabel = movie.format ? FORMAT_LABELS[movie.format] : "";
  const detail = [movie.watched_date, formatLabel, locationName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-card rounded-lg px-3 py-2.5 flex justify-between items-center">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold truncate">{movie.title}</div>
        <div className="text-[10px] text-gray-500 truncate">{detail}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {movie.letterboxd_rating && (
          <span className="text-[10px] text-accent-yellow">
            ★ {movie.letterboxd_rating}
          </span>
        )}
        {movie.ticket_value && (
          <span className="text-xs text-accent font-bold">
            +${movie.ticket_value.toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create movie list component**

Create `src/components/movie-list.tsx`:

```tsx
import type { Movie } from "@/lib/types";
import { MovieRow } from "./movie-row";

export function MovieList({ movies }: { movies: Movie[] }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");

  if (amcMovies.length === 0) {
    return (
      <div className="text-center py-6 text-gray-600 text-sm">
        No AMC movies in this period
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] text-gray-500">Recent Movies</div>
      {amcMovies.map((movie) => (
        <MovieRow key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Build the home page**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useTimeRange } from "@/hooks/use-time-range";
import { useMovies } from "@/hooks/use-movies";
import { useSettings } from "@/hooks/use-settings";
import { calculateSavings, prorateMembershipCost } from "@/lib/savings";
import { TimeRangePills } from "@/components/time-range-pills";
import { SavingsHero } from "@/components/savings-hero";
import { BreakEvenCard } from "@/components/break-even-card";
import { QuickStats } from "@/components/quick-stats";
import { MovieList } from "@/components/movie-list";
import Link from "next/link";

export default function Home() {
  const { range, setRange, dateRange } = useTimeRange();
  const { movies, loading: moviesLoading } = useMovies(dateRange);
  const { profile, loading: settingsLoading } = useSettings();

  const loading = moviesLoading || settingsLoading;
  const membershipCost = profile?.membership_cost ?? 25.99;

  const proratedCost =
    range === "all_time"
      ? prorateMembershipCost(membershipCost, dateRange.from, dateRange.to)
      : range === "this_month"
        ? membershipCost
        : prorateMembershipCost(membershipCost, dateRange.from, dateRange.to);

  const summary = calculateSavings(movies, proratedCost);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">AMC Tracker</span>
        <Link href="/settings" className="text-gray-500 text-sm">
          ⚙
        </Link>
      </div>

      {/* Time range */}
      <TimeRangePills value={range} onChange={setRange} />

      {loading ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          Loading...
        </div>
      ) : (
        <>
          <SavingsHero summary={summary} />
          <BreakEvenCard summary={summary} />
          <QuickStats summary={summary} />
          <MovieList movies={movies} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify home page renders**

```bash
npm run dev
```

Expected: Home page shows time range pills, savings hero ($0.00 with no data), break-even comparison (red net savings of -$25.99), stats, and "No AMC movies" message.

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: build home dashboard with savings hero and break-even display"
```

---

## Task 12: Bottom Sheet + Movie Triage Sheet

**Files:**
- Create: `src/components/bottom-sheet.tsx`, `src/components/movie-triage-sheet.tsx`

- [ ] **Step 1: Create reusable bottom sheet**

Create `src/components/bottom-sheet.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-[#1e1e2e] rounded-t-2xl max-h-[85vh] overflow-y-auto border-t border-gray-700"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-gray-600 rounded-full" />
        </div>
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create movie triage sheet**

Create `src/components/movie-triage-sheet.tsx`:

```tsx
"use client";

import { useState } from "react";
import type {
  VenueType,
  MovieFormat,
  AmcLocation,
  FormatPricing,
  LetterboxdEntry,
} from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";
import { calculateTicketValue } from "@/lib/savings";

interface MovieTriageSheetProps {
  entry: LetterboxdEntry | { title: string; watched_date: string };
  pricing: FormatPricing[];
  locations: AmcLocation[];
  onSave: (data: {
    title: string;
    watched_date: string;
    venue_type: VenueType;
    format?: MovieFormat;
    amc_location_id?: string;
    is_discount_day: boolean;
    ticket_value?: number;
    letterboxd_rating?: number;
    letterboxd_url?: string;
    source: "letterboxd_sync" | "manual";
  }) => void;
  onAddLocation: (name: string) => Promise<AmcLocation | undefined>;
  source: "letterboxd_sync" | "manual";
}

export function MovieTriageSheet({
  entry,
  pricing,
  locations,
  onSave,
  onAddLocation,
  source,
}: MovieTriageSheetProps) {
  const [venueType, setVenueType] = useState<VenueType | null>(null);
  const [format, setFormat] = useState<MovieFormat | null>(null);
  const [locationId, setLocationId] = useState<string>("");
  const [isDiscountDay, setIsDiscountDay] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);

  const lbEntry = "rating" in entry ? (entry as LetterboxdEntry) : null;

  // Auto-detect discount day from watched_date
  const watchedDay = new Date(entry.watched_date + "T12:00:00").getDay();
  const suggestDiscount = watchedDay === 2 || watchedDay === 3;

  const availableFormats = pricing.map((p) => p.format);

  async function handleSave() {
    if (!venueType) return;

    if (venueType !== "amc") {
      onSave({
        title: entry.title,
        watched_date: entry.watched_date,
        venue_type: venueType,
        is_discount_day: false,
        letterboxd_rating: lbEntry?.rating ?? undefined,
        letterboxd_url: lbEntry?.letterboxd_url,
        source,
      });
      return;
    }

    const ticketValue = format
      ? calculateTicketValue(format, isDiscountDay, pricing)
      : undefined;

    onSave({
      title: entry.title,
      watched_date: entry.watched_date,
      venue_type: "amc",
      format: format ?? undefined,
      amc_location_id: locationId || undefined,
      is_discount_day: isDiscountDay,
      ticket_value: ticketValue,
      letterboxd_rating: lbEntry?.rating ?? undefined,
      letterboxd_url: lbEntry?.letterboxd_url,
      source,
    });
  }

  async function handleAddLocation() {
    if (!newLocationName.trim()) return;
    const loc = await onAddLocation(newLocationName.trim());
    if (loc) {
      setLocationId(loc.id);
      setShowNewLocation(false);
      setNewLocationName("");
    }
  }

  return (
    <div>
      {/* Movie info */}
      <div className="text-center mb-4">
        <div className="text-base font-bold">{entry.title}</div>
        <div className="text-xs text-gray-500">
          {entry.watched_date}
          {lbEntry?.rating && (
            <span className="text-accent-yellow"> · ★ {lbEntry.rating}</span>
          )}
        </div>
      </div>

      {/* Venue type */}
      <div className="text-xs text-gray-500 font-semibold mb-2">
        Where did you see this?
      </div>
      <div className="flex gap-2 mb-4">
        {(
          [
            { value: "amc", label: "AMC Theater", icon: "🎬" },
            { value: "other_theater", label: "Other Theater", icon: "🎥" },
            { value: "home", label: "Home", icon: "🏠" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setVenueType(opt.value)}
            className={`flex-1 rounded-xl p-3 text-center border-2 transition-colors ${
              venueType === opt.value
                ? "border-accent bg-accent/10"
                : "border-gray-700 bg-card"
            }`}
          >
            <div className="text-lg mb-0.5">{opt.icon}</div>
            <div
              className={`text-[11px] ${
                venueType === opt.value
                  ? "text-accent font-semibold"
                  : "text-gray-500"
              }`}
            >
              {opt.label}
            </div>
          </button>
        ))}
      </div>

      {/* AMC-specific fields */}
      {venueType === "amc" && (
        <>
          {/* Format */}
          <div className="text-xs text-gray-500 font-semibold mb-2">
            Format
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {availableFormats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-lg px-3.5 py-2 text-xs border transition-colors ${
                  format === f
                    ? "border-accent bg-accent/10 text-accent font-semibold"
                    : "border-gray-700 bg-card text-gray-400"
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Location */}
          <div className="text-xs text-gray-500 font-semibold mb-2">
            Location
          </div>
          {locations.length > 0 && !showNewLocation && (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-card border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white mb-2"
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}
          {showNewLocation ? (
            <div className="flex gap-2 mb-4">
              <input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. AMC Boston Common"
                className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600"
              />
              <button
                onClick={handleAddLocation}
                className="bg-accent text-black px-3 py-2 rounded-lg text-xs font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewLocation(false)}
                className="text-gray-500 text-xs px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewLocation(true)}
              className="text-accent text-xs mb-4"
            >
              + Add new location
            </button>
          )}

          {/* Discount day */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-500 font-semibold">
                Discount day (Tue/Wed)?
              </div>
              <div className="text-[9px] text-gray-600">
                Half-price ticket value
                {suggestDiscount && " · This was a " + ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][watchedDay]}
              </div>
            </div>
            <button
              onClick={() => setIsDiscountDay(!isDiscountDay)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                isDiscountDay ? "bg-accent" : "bg-gray-700"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isDiscountDay ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>
        </>
      )}

      {/* Save button */}
      {venueType && (
        <button
          onClick={handleSave}
          className="w-full bg-accent text-black font-bold py-3 rounded-xl text-sm"
        >
          Save
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-sheet.tsx src/components/movie-triage-sheet.tsx
git commit -m "feat: add bottom sheet and movie triage sheet components"
```

---

## Task 13: Sync Tab

**Files:**
- Create: `src/components/movie-search.tsx`
- Modify: `src/app/sync/page.tsx`

- [ ] **Step 1: Create movie search component**

Create `src/components/movie-search.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { TmdbSearchResult } from "@/lib/tmdb";

interface MovieSearchProps {
  onSelect: (movie: TmdbSearchResult) => void;
}

export function MovieSearch({ onSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie..."
        className="w-full bg-card border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border border-gray-700 rounded-xl mt-1 max-h-60 overflow-y-auto z-10">
          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => {
                onSelect(movie);
                setQuery(movie.title);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-800 border-b border-gray-800 last:border-0"
            >
              <div className="text-sm font-medium">{movie.title}</div>
              {movie.release_date && (
                <div className="text-xs text-gray-500">
                  {movie.release_date.split("-")[0]}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build the sync page**

Replace `src/app/sync/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useMovies } from "@/hooks/use-movies";
import { BottomSheet } from "@/components/bottom-sheet";
import { MovieTriageSheet } from "@/components/movie-triage-sheet";
import { MovieSearch } from "@/components/movie-search";
import type { LetterboxdEntry } from "@/lib/types";
import type { TmdbSearchResult } from "@/lib/tmdb";

export default function SyncPage() {
  const { profile, pricing, locations, addLocation } = useSettings();
  const { addMovie, checkDuplicate } = useMovies({
    from: "2000-01-01",
    to: "2099-12-31",
  });

  const [entries, setEntries] = useState<LetterboxdEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LetterboxdEntry | null>(
    null
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Manual entry state
  const [showManual, setShowManual] = useState(false);
  const [manualMovie, setManualMovie] = useState<{
    title: string;
    tmdb_id?: number;
    watched_date: string;
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncError("");
    try {
      const res = await fetch("/api/letterboxd");
      if (!res.ok) {
        const data = await res.json();
        setSyncError(data.error || "Sync failed");
        return;
      }
      const data: LetterboxdEntry[] = await res.json();
      setEntries(data);
    } catch {
      setSyncError("Failed to connect");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSaveEntry(data: Parameters<typeof addMovie>[0]) {
    const isDuplicate = await checkDuplicate(data.title, data.watched_date);
    if (isDuplicate) {
      if (!confirm(`"${data.title}" was already logged on ${data.watched_date}. Add anyway?`)) {
        return;
      }
    }

    await addMovie(data);
    const key = `${data.title}-${data.watched_date}`;
    setSavedIds((prev) => new Set(prev).add(key));
    setSelectedEntry(null);
    setManualMovie(null);
    setShowManual(false);
  }

  function handleTmdbSelect(movie: TmdbSearchResult) {
    setManualMovie({
      title: movie.title,
      tmdb_id: movie.id,
      watched_date: new Date().toISOString().split("T")[0],
    });
  }

  const unsavedEntries = entries.filter(
    (e) => !savedIds.has(`${e.title}-${e.watched_date}`)
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sync</h1>

      {/* Letterboxd sync */}
      <div className="space-y-2">
        <button
          onClick={handleSync}
          disabled={syncing || !profile?.letterboxd_username}
          className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync from Letterboxd"}
        </button>
        {!profile?.letterboxd_username && (
          <p className="text-xs text-gray-500">
            Set your Letterboxd username in{" "}
            <a href="/settings" className="text-accent">
              Settings
            </a>{" "}
            first
          </p>
        )}
        {syncError && <p className="text-xs text-accent-red">{syncError}</p>}
      </div>

      {/* Synced entries */}
      {unsavedEntries.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500">
            {unsavedEntries.length} new movie
            {unsavedEntries.length !== 1 ? "s" : ""} found
          </div>
          {unsavedEntries.map((entry) => (
            <button
              key={`${entry.title}-${entry.watched_date}`}
              onClick={() => setSelectedEntry(entry)}
              className="w-full bg-card rounded-lg px-3 py-2.5 flex items-center gap-3 border-2 border-gray-800 text-left"
            >
              <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-sm">
                🎬
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">
                  {entry.title}
                </div>
                <div className="text-[10px] text-gray-500">
                  {entry.watched_date}
                  {entry.rating && (
                    <span className="text-accent-yellow">
                      {" "}
                      · ★ {entry.rating}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-gray-600 text-sm">›</span>
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Manual entry */}
      <button
        onClick={() => setShowManual(true)}
        className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold"
      >
        + Add Manually
      </button>

      {/* Bottom sheet for Letterboxd entry */}
      <BottomSheet
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      >
        {selectedEntry && (
          <MovieTriageSheet
            entry={selectedEntry}
            pricing={pricing}
            locations={locations}
            onSave={handleSaveEntry}
            onAddLocation={addLocation}
            source="letterboxd_sync"
          />
        )}
      </BottomSheet>

      {/* Bottom sheet for manual entry */}
      <BottomSheet
        open={showManual}
        onClose={() => {
          setShowManual(false);
          setManualMovie(null);
        }}
      >
        <div className="space-y-4">
          {!manualMovie ? (
            <>
              <div className="text-sm font-semibold text-center">
                Add a Movie
              </div>
              <MovieSearch onSelect={handleTmdbSelect} />
            </>
          ) : (
            <>
              {/* Date picker for manual entry */}
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-2">
                  When did you watch it?
                </div>
                <input
                  type="date"
                  value={manualMovie.watched_date}
                  onChange={(e) =>
                    setManualMovie({
                      ...manualMovie,
                      watched_date: e.target.value,
                    })
                  }
                  className="w-full bg-card border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>
              <MovieTriageSheet
                entry={{
                  title: manualMovie.title,
                  watched_date: manualMovie.watched_date,
                }}
                pricing={pricing}
                locations={locations}
                onSave={(data) =>
                  handleSaveEntry({
                    ...data,
                    tmdb_id: manualMovie.tmdb_id,
                  })
                }
                onAddLocation={addLocation}
                source="manual"
              />
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
```

- [ ] **Step 3: Verify sync flow**

```bash
npm run dev
```

Expected: Sync tab shows "Sync from Letterboxd" button (disabled if no username in settings) and "Add Manually" button. Manual entry opens bottom sheet with TMDB search.

- [ ] **Step 4: Commit**

```bash
git add src/components/movie-search.tsx src/app/sync/page.tsx
git commit -m "feat: build sync tab with Letterboxd sync and manual entry"
```

---

## Task 14: Stats Tab

**Files:**
- Create: `src/components/savings-chart.tsx`, `src/components/monthly-breakdown.tsx`, `src/components/letterboxd-insights.tsx`, `src/components/format-location-stats.tsx`
- Modify: `src/app/stats/page.tsx`

- [ ] **Step 1: Create savings chart component**

Create `src/components/savings-chart.tsx`:

```tsx
"use client";

import type { Movie } from "@/lib/types";

interface SavingsChartProps {
  movies: Movie[];
  membershipCost: number;
}

export function SavingsChart({ movies, membershipCost }: SavingsChartProps) {
  const amcMovies = movies
    .filter((m) => m.venue_type === "amc" && m.ticket_value)
    .sort((a, b) => a.watched_date.localeCompare(b.watched_date));

  if (amcMovies.length === 0) {
    return (
      <div className="bg-card rounded-xl p-3 text-center text-gray-600 text-sm">
        No data yet
      </div>
    );
  }

  // Build cumulative savings by month
  const monthMap = new Map<string, number>();
  let cumulative = 0;

  for (const movie of amcMovies) {
    const month = movie.watched_date.substring(0, 7); // YYYY-MM
    cumulative += movie.ticket_value ?? 0;

    // Subtract membership for each new month
    if (!monthMap.has(month)) {
      cumulative -= membershipCost;
    }

    monthMap.set(month, cumulative);
  }

  const points = Array.from(monthMap.entries());
  const values = points.map(([, v]) => v);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const width = 280;
  const height = 80;
  const padding = 4;

  const svgPoints = points
    .map(([, val], i) => {
      const x = padding + (i / Math.max(points.length - 1, 1)) * (width - 2 * padding);
      const y = padding + ((maxVal - val) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">
        SAVINGS OVER TIME
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={svgPoints}
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute top-0 right-1 text-[8px] text-gray-500">
          ${maxVal.toFixed(0)}
        </div>
        <div className="absolute bottom-0 right-1 text-[8px] text-gray-500">
          ${minVal.toFixed(0)}
        </div>
      </div>
      <div className="flex justify-between text-[8px] text-gray-600 mt-1">
        <span>{points[0]?.[0]}</span>
        <span>{points[points.length - 1]?.[0]}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create monthly breakdown component**

Create `src/components/monthly-breakdown.tsx`:

```tsx
import type { Movie } from "@/lib/types";

interface MonthlyBreakdownProps {
  movies: Movie[];
  membershipCost: number;
}

export function MonthlyBreakdown({
  movies,
  membershipCost,
}: MonthlyBreakdownProps) {
  const amcMovies = movies.filter(
    (m) => m.venue_type === "amc" && m.ticket_value
  );

  // Group by month
  const monthMap = new Map<string, { total: number; count: number }>();
  for (const movie of amcMovies) {
    const month = movie.watched_date.substring(0, 7);
    const existing = monthMap.get(month) || { total: 0, count: 0 };
    existing.total += movie.ticket_value ?? 0;
    existing.count += 1;
    monthMap.set(month, existing);
  }

  const months = Array.from(monthMap.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  if (months.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...months.map(([, d]) => d.total));

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">
        MONTHLY BREAKDOWN
      </div>
      <div className="space-y-1.5">
        {months.map(([month, data]) => {
          const isPositive = data.total >= membershipCost;
          return (
            <div key={month}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-400">{month}</span>
                <span className={isPositive ? "text-accent" : "text-accent-red"}>
                  ${data.total.toFixed(2)} · {data.count} movie
                  {data.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-gray-800 rounded-sm h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-sm ${
                    isPositive ? "bg-accent" : "bg-accent-red"
                  }`}
                  style={{
                    width: `${(data.total / maxTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Letterboxd insights component**

Create `src/components/letterboxd-insights.tsx`:

```tsx
import type { Movie } from "@/lib/types";

export function LetterboxdInsights({ movies }: { movies: Movie[] }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");

  const userRatings = amcMovies
    .map((m) => m.letterboxd_rating)
    .filter((r): r is number => r !== null);

  const avgRatings = amcMovies
    .map((m) => m.letterboxd_avg_rating)
    .filter((r): r is number => r !== null);

  if (userRatings.length === 0) return null;

  const userAvg =
    userRatings.reduce((a, b) => a + b, 0) / userRatings.length;
  const lbAvg =
    avgRatings.length > 0
      ? avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length
      : null;
  const diff = lbAvg !== null ? userAvg - lbAvg : null;

  // Rating distribution (0.5 to 5.0 in 0.5 steps → bucket into 1-5)
  const distribution = [0, 0, 0, 0, 0]; // indices 0-4 = stars 1-5
  for (const r of userRatings) {
    const bucket = Math.min(Math.max(Math.ceil(r) - 1, 0), 4);
    distribution[bucket]++;
  }
  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">
        LETTERBOXD INSIGHTS
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-base font-bold text-accent-yellow">
            {userAvg.toFixed(1)}
          </div>
          <div className="text-[9px] text-gray-500">Your Avg</div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-base font-bold text-gray-400">
            {lbAvg !== null ? lbAvg.toFixed(1) : "—"}
          </div>
          <div className="text-[9px] text-gray-500">LB Avg</div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
          <div
            className={`text-base font-bold ${
              diff !== null && diff >= 0 ? "text-accent-cyan" : "text-accent-red"
            }`}
          >
            {diff !== null ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}` : "—"}
          </div>
          <div className="text-[9px] text-gray-500">Diff</div>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="flex items-end gap-1 h-12">
        {distribution.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="bg-accent-yellow rounded-sm w-4/5"
              style={{ height: `${(count / maxDist) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
            />
            <div className="text-[8px] text-gray-500 mt-0.5">{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="text-[9px] text-gray-600 text-center mt-1">
        Your rating distribution
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create format/location stats component**

Create `src/components/format-location-stats.tsx`:

```tsx
import type { Movie } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";

export function FormatLocationStats({ movies }: { movies: Movie[] }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");

  // Format counts
  const formatCounts = new Map<string, number>();
  for (const m of amcMovies) {
    if (m.format) {
      formatCounts.set(m.format, (formatCounts.get(m.format) || 0) + 1);
    }
  }

  // Location counts
  const locationCounts = new Map<string, number>();
  for (const m of amcMovies) {
    const name = m.amc_location?.name;
    if (name) {
      locationCounts.set(name, (locationCounts.get(name) || 0) + 1);
    }
  }

  const sortedLocations = Array.from(locationCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  if (amcMovies.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">
        FORMATS & LOCATIONS
      </div>
      {formatCounts.size > 0 && (
        <div className="flex gap-1.5 mb-3">
          {Array.from(formatCounts.entries()).map(([format, count]) => (
            <div
              key={format}
              className="flex-1 bg-gray-800 rounded-lg p-2 text-center"
            >
              <div className="text-sm font-bold">{count}</div>
              <div className="text-[9px] text-gray-500">
                {FORMAT_LABELS[format as keyof typeof FORMAT_LABELS] || format}
              </div>
            </div>
          ))}
        </div>
      )}
      {sortedLocations.length > 0 && (
        <div className="space-y-1">
          {sortedLocations.map(([name, count]) => (
            <div key={name} className="flex justify-between text-[10px]">
              <span className="text-gray-400">{name}</span>
              <span className="text-gray-500">
                {count} visit{count !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Build the stats page**

Replace `src/app/stats/page.tsx`:

```tsx
"use client";

import { useTimeRange } from "@/hooks/use-time-range";
import { useMovies } from "@/hooks/use-movies";
import { useSettings } from "@/hooks/use-settings";
import { TimeRangePills } from "@/components/time-range-pills";
import { SavingsChart } from "@/components/savings-chart";
import { MonthlyBreakdown } from "@/components/monthly-breakdown";
import { LetterboxdInsights } from "@/components/letterboxd-insights";
import { FormatLocationStats } from "@/components/format-location-stats";

export default function StatsPage() {
  const { range, setRange, dateRange } = useTimeRange();
  const { movies, loading: moviesLoading } = useMovies(dateRange);
  const { profile, loading: settingsLoading } = useSettings();

  const loading = moviesLoading || settingsLoading;
  const membershipCost = profile?.membership_cost ?? 25.99;

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Stats</h1>
      </div>

      <TimeRangePills value={range} onChange={setRange} />

      {loading ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          <SavingsChart movies={movies} membershipCost={membershipCost} />
          <MonthlyBreakdown
            movies={movies}
            membershipCost={membershipCost}
          />
          <LetterboxdInsights movies={movies} />
          <FormatLocationStats movies={movies} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/savings-chart.tsx src/components/monthly-breakdown.tsx src/components/letterboxd-insights.tsx src/components/format-location-stats.tsx src/app/stats/page.tsx
git commit -m "feat: build stats tab with charts and insights"
```

---

## Task 15: Simulate Tab

**Files:**
- Create: `src/components/simulator-form.tsx`, `__tests__/components/simulator-form.test.tsx`
- Modify: `src/app/simulate/page.tsx`

- [ ] **Step 1: Write failing test for simulator logic**

Create `__tests__/components/simulator-form.test.tsx`:

```tsx
import { calculateSimulation } from "@/components/simulator-form";

describe("calculateSimulation", () => {
  it("calculates monthly spend for standard format", () => {
    const result = calculateSimulation({
      moviesPerMonth: 3,
      format: "standard",
      isDiscountDay: false,
    });
    expect(result.monthlySpend).toBeCloseTo(47.97, 2);
  });

  it("calculates savings vs membership", () => {
    const result = calculateSimulation({
      moviesPerMonth: 3,
      format: "standard",
      isDiscountDay: false,
    });
    expect(result.monthlySavings).toBeCloseTo(47.97 - 25.99, 2);
  });

  it("calculates yearly savings", () => {
    const result = calculateSimulation({
      moviesPerMonth: 3,
      format: "standard",
      isDiscountDay: false,
    });
    expect(result.yearlySavings).toBeCloseTo((47.97 - 25.99) * 12, 1);
  });

  it("applies discount pricing for discount days", () => {
    const result = calculateSimulation({
      moviesPerMonth: 3,
      format: "standard",
      isDiscountDay: true,
    });
    expect(result.monthlySpend).toBeCloseTo(24.0, 2);
  });

  it("uses mix pricing (average of all formats)", () => {
    const result = calculateSimulation({
      moviesPerMonth: 1,
      format: "mix",
      isDiscountDay: false,
    });
    // Average of standard (15.99), imax (22.99), dolby (22.99) = 20.66
    expect(result.monthlySpend).toBeCloseTo(20.66, 1);
  });

  it("returns negative savings when not worth it", () => {
    const result = calculateSimulation({
      moviesPerMonth: 1,
      format: "standard",
      isDiscountDay: true,
    });
    // 8.00 spend vs 25.99 membership
    expect(result.monthlySavings).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/simulator-form.test.tsx --verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Build simulator form with calculation logic**

Create `src/components/simulator-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DEFAULT_PRICING, DEFAULT_MEMBERSHIP_COST } from "@/lib/constants";

interface SimulationInput {
  moviesPerMonth: number;
  format: "standard" | "imax" | "dolby_cinema" | "mix";
  isDiscountDay: boolean;
}

interface SimulationResult {
  monthlySpend: number;
  monthlySavings: number;
  yearlySavings: number;
  membershipCost: number;
}

export function calculateSimulation(input: SimulationInput): SimulationResult {
  const membershipCost = DEFAULT_MEMBERSHIP_COST;

  let pricePerTicket: number;

  if (input.format === "mix") {
    const prices = DEFAULT_PRICING.map((p) =>
      input.isDiscountDay ? p.discount_price : p.regular_price
    );
    pricePerTicket = prices.reduce((a, b) => a + b, 0) / prices.length;
  } else {
    const formatPricing = DEFAULT_PRICING.find(
      (p) => p.format === input.format
    );
    pricePerTicket = formatPricing
      ? input.isDiscountDay
        ? formatPricing.discount_price
        : formatPricing.regular_price
      : 0;
  }

  const monthlySpend = pricePerTicket * input.moviesPerMonth;
  const monthlySavings = monthlySpend - membershipCost;

  return {
    monthlySpend,
    monthlySavings,
    yearlySavings: monthlySavings * 12,
    membershipCost,
  };
}

export function SimulatorForm() {
  const [step, setStep] = useState(0);
  const [hasAmc, setHasAmc] = useState<boolean | null>(null);
  const [moviesPerMonth, setMoviesPerMonth] = useState(3);
  const [format, setFormat] = useState<
    "standard" | "imax" | "dolby_cinema" | "mix"
  >("standard");
  const [isDiscountDay, setIsDiscountDay] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  function handleCalculate() {
    setResult(calculateSimulation({ moviesPerMonth, format, isDiscountDay }));
    setStep(4);
  }

  function reset() {
    setStep(0);
    setHasAmc(null);
    setMoviesPerMonth(3);
    setFormat("standard");
    setIsDiscountDay(false);
    setResult(null);
  }

  // Step 0: AMC nearby?
  if (step === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold">
          Is there an AMC theater near you?
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setHasAmc(true);
              setStep(1);
            }}
            className="flex-1 bg-card border-2 border-gray-700 rounded-xl py-4 text-sm font-semibold hover:border-accent transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => {
              setHasAmc(false);
              setStep(4);
            }}
            className="flex-1 bg-card border-2 border-gray-700 rounded-xl py-4 text-sm font-semibold hover:border-accent-red transition-colors"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  // No AMC result
  if (step === 4 && hasAmc === false) {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-bold">Not for you (yet)</div>
        <p className="text-sm text-gray-400">
          A-List requires an AMC theater nearby. It probably isn't worth it if
          you'd have to travel far for every movie.
        </p>
        <button onClick={reset} className="text-accent text-sm font-semibold">
          Start over
        </button>
      </div>
    );
  }

  // Step 1: Movies per month
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold">
          How many movies do you see in theaters per month?
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-accent">{moviesPerMonth}</div>
          <input
            type="range"
            min="1"
            max="8"
            value={moviesPerMonth}
            onChange={(e) => setMoviesPerMonth(parseInt(e.target.value))}
            className="w-full mt-4 accent-accent"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>8+</span>
          </div>
        </div>
        <button
          onClick={() => setStep(2)}
          className="w-full bg-accent text-black font-bold py-3 rounded-xl"
        >
          Next
        </button>
      </div>
    );
  }

  // Step 2: Format
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold">
          What format do you usually pick?
        </div>
        <div className="space-y-2">
          {(
            [
              { value: "standard", label: "Standard", price: "$15.99" },
              { value: "imax", label: "IMAX", price: "$22.99" },
              { value: "dolby_cinema", label: "Dolby Cinema", price: "$22.99" },
              { value: "mix", label: "Mix of everything", price: "~$20.66 avg" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFormat(opt.value);
                setStep(3);
              }}
              className={`w-full bg-card border-2 rounded-xl px-4 py-3 text-left transition-colors ${
                format === opt.value
                  ? "border-accent"
                  : "border-gray-700"
              }`}
            >
              <div className="text-sm font-semibold">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.price} per ticket</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Discount days
  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold">
          Do you usually go on discount days (Tue/Wed)?
        </div>
        <p className="text-xs text-gray-500">
          AMC offers half-price tickets on Tuesdays and Wednesdays
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsDiscountDay(true);
              handleCalculate();
            }}
            className="flex-1 bg-card border-2 border-gray-700 rounded-xl py-4 text-sm font-semibold hover:border-accent transition-colors"
          >
            Mostly yes
          </button>
          <button
            onClick={() => {
              setIsDiscountDay(false);
              handleCalculate();
            }}
            className="flex-1 bg-card border-2 border-gray-700 rounded-xl py-4 text-sm font-semibold hover:border-accent transition-colors"
          >
            Not usually
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Results
  if (step === 4 && result) {
    const isWorth = result.monthlySavings > 0;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-bold mb-4">
            {isWorth ? "A-List would save you money!" : "A-List might not be worth it"}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              You'd spend on tickets
            </span>
            <span className="font-semibold">
              ${result.monthlySpend.toFixed(2)}/mo
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">A-List costs</span>
            <span className="font-semibold">
              ${result.membershipCost.toFixed(2)}/mo
            </span>
          </div>
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Monthly savings</span>
              <span
                className={`font-bold ${
                  isWorth ? "text-accent" : "text-accent-red"
                }`}
              >
                {isWorth ? "+" : ""}${result.monthlySavings.toFixed(2)}/mo
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Yearly savings</span>
              <span
                className={`font-bold ${
                  isWorth ? "text-accent" : "text-accent-red"
                }`}
              >
                {isWorth ? "+" : ""}${result.yearlySavings.toFixed(2)}/yr
              </span>
            </div>
          </div>
        </div>

        {!isWorth && (
          <p className="text-xs text-gray-500 text-center">
            You'd overpay by ${Math.abs(result.monthlySavings).toFixed(2)} per
            month. Try seeing more movies or going to premium formats!
          </p>
        )}

        <button
          onClick={reset}
          className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold"
        >
          Try different numbers
        </button>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/simulator-form.test.tsx --verbose
```

Expected: All tests PASS.

- [ ] **Step 5: Build the simulate page**

Replace `src/app/simulate/page.tsx`:

```tsx
import { SimulatorForm } from "@/components/simulator-form";

export default function SimulatePage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Would A-List save you money?</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quick calculator — no account needed
        </p>
      </div>
      <SimulatorForm />
    </div>
  );
}
```

- [ ] **Step 6: Verify simulator works**

```bash
npm run dev
```

Expected: Navigate to /simulate, walk through the wizard. With 3 standard movies/month on non-discount days: $47.97 spend, +$21.98/mo savings.

- [ ] **Step 7: Commit**

```bash
git add src/components/simulator-form.tsx __tests__/components/simulator-form.test.tsx src/app/simulate/page.tsx
git commit -m "feat: build simulate tab with savings calculator"
```

---

## Task 16: Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Build the settings page**

Replace `src/app/settings/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FORMAT_LABELS, DAY_LABELS } from "@/lib/constants";

export default function SettingsPage() {
  const {
    profile,
    pricing,
    discountDays,
    locations,
    loading,
    updateProfile,
    updatePricing,
    addLocation,
    removeLocation,
  } = useSettings();
  const router = useRouter();

  const [letterboxdUsername, setLetterboxdUsername] = useState("");
  const [membershipCost, setMembershipCost] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form values from profile once loaded
  if (profile && !initialized) {
    setLetterboxdUsername(profile.letterboxd_username || "");
    setMembershipCost(profile.membership_cost.toString());
    setInitialized(true);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 text-sm pt-12">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Letterboxd username */}
      <section>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">
          Letterboxd Username
        </label>
        <div className="flex gap-2">
          <input
            value={letterboxdUsername}
            onChange={(e) => setLetterboxdUsername(e.target.value)}
            placeholder="your-username"
            className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
          />
          <button
            onClick={() =>
              updateProfile({ letterboxd_username: letterboxdUsername || null })
            }
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </section>

      {/* Membership cost */}
      <section>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">
          Monthly Membership Cost
        </label>
        <div className="flex gap-2">
          <div className="flex items-center bg-card border border-gray-700 rounded-lg px-3 flex-1">
            <span className="text-gray-500 mr-1">$</span>
            <input
              type="number"
              step="0.01"
              value={membershipCost}
              onChange={(e) => setMembershipCost(e.target.value)}
              className="bg-transparent py-2 text-sm text-white flex-1 focus:outline-none"
            />
          </div>
          <button
            onClick={() =>
              updateProfile({
                membership_cost: parseFloat(membershipCost) || 25.99,
              })
            }
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </section>

      {/* Format pricing */}
      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">
          Format Pricing
        </div>
        <div className="space-y-2">
          {pricing.map((p) => (
            <div key={p.id} className="bg-card rounded-lg p-3">
              <div className="text-xs font-semibold mb-2">
                {FORMAT_LABELS[p.format]}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">
                    Regular
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.regular_price}
                    onBlur={(e) =>
                      updatePricing(
                        p.format,
                        parseFloat(e.target.value),
                        p.discount_price
                      )
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">
                    Discount
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.discount_price}
                    onBlur={(e) =>
                      updatePricing(
                        p.format,
                        p.regular_price,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AMC Locations */}
      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">
          AMC Locations
        </div>
        <div className="space-y-1.5 mb-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-card rounded-lg px-3 py-2 flex justify-between items-center"
            >
              <span className="text-sm">{loc.name}</span>
              <button
                onClick={() => removeLocation(loc.id)}
                className="text-gray-600 text-xs hover:text-accent-red"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="e.g. AMC Boston Common"
            className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
          />
          <button
            onClick={async () => {
              if (newLocationName.trim()) {
                await addLocation(newLocationName.trim());
                setNewLocationName("");
              }
            }}
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Add
          </button>
        </div>
      </section>

      {/* Discount Days */}
      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">
          Discount Days
        </div>
        <div className="text-xs text-gray-400">
          {discountDays
            .map((d) => DAY_LABELS[d.day_of_week])
            .join(", ") || "None set"}
        </div>
        <p className="text-[10px] text-gray-600 mt-1">
          Edit discount days in the Supabase dashboard for now
        </p>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm text-accent-red font-semibold"
      >
        Log Out
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: build settings page with pricing, locations, and profile config"
```

---

## Task 17: PWA Configuration

**Files:**
- Create: `src/app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create web manifest**

Create `src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMC Tracker",
    short_name: "AMC Tracker",
    description: "Track your AMC A-List savings",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

- [ ] **Step 2: Generate placeholder PWA icons**

```bash
# Create simple placeholder icons using ImageMagick (if available) or just create placeholder files
# If ImageMagick is not available, create these manually or use an online generator
mkdir -p public/icons

# Create a simple SVG-based icon as placeholder
cat > public/icons/icon.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#111111"/>
  <text x="256" y="300" font-family="system-ui" font-size="200" font-weight="bold" fill="#4ade80" text-anchor="middle">A</text>
</svg>
SVG
```

Note: Replace with proper PNG icons before deploying. Use an online tool like realfavicongenerator.net or create 192x192 and 512x512 PNG files.

- [ ] **Step 3: Add apple-touch-icon meta to layout**

Modify `src/app/layout.tsx` — update the metadata export:

```tsx
export const metadata: Metadata = {
  title: "AMC Tracker",
  description: "Track your AMC A-List savings",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AMC Tracker",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add src/app/manifest.ts public/icons/ src/app/layout.tsx
git commit -m "feat: add PWA manifest and icons"
```

---

## Task 18: Final Wiring + Cleanup

**Files:**
- Modify: various files for final integration checks

- [ ] **Step 1: Add scrollbar-hide utility to globals.css**

Add to `src/app/globals.css`:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Update .gitignore**

Ensure `.gitignore` includes:

```
.env.local
.superpowers/
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --verbose
```

Expected: All tests pass.

- [ ] **Step 4: Run build to check for type errors**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final wiring, cleanup, and build verification"
```

- [ ] **Step 6: Push to GitHub**

```bash
git push origin main
```

Expected: All code pushed to jalaj-s/amc_alist_tracker.
