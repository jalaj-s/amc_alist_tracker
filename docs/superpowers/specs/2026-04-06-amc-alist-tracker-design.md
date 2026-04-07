# AMC A-List Tracker — Design Spec

## Overview

A mobile-first PWA for tracking movies seen with an AMC A-List membership, calculating savings over time, and determining if the membership is paying for itself. Integrates with Letterboxd for movie data and ratings. Includes a simulator to help non-members see if A-List would be worth it for them.

## Core Problem

AMC A-List costs ~$25.99/month. Members have no easy way to know if they're getting their money's worth. This app answers: "Am I breaking even? How much am I actually saving?"

## Tech Stack

- **Next.js** — React framework, PWA-capable
- **Tailwind CSS** — utility-first CSS, dark theme, mobile-first
- **Supabase** — Postgres database + auth
- **TMDB API** — movie search, autocomplete, metadata (free)
- **Letterboxd RSS** — scrape public profile RSS feed for diary entries
- **Vercel** — deployment (free tier)

## Data Model

### Users
- `id` (uuid, PK)
- `email`
- `letterboxd_username` (nullable)
- `membership_cost` (decimal, default 25.99)
- `created_at`

### AMC Locations
- `id` (uuid, PK)
- `user_id` (FK)
- `name` (e.g. "AMC Empire 25")
- `created_at`

### Format Pricing
- `id` (uuid, PK)
- `user_id` (FK)
- `format` (enum: standard, imax, dolby_cinema, 3d, prime, screenx)
- `regular_price` (decimal)
- `discount_price` (decimal — Tue/Wed half-price)

Default prices seeded on account creation (based on Boston AMC pricing):
| Format | Regular | Discount (Tue/Wed, 50% off) |
|--------|---------|----------------------------|
| Standard | $15.99 | $8.00 |
| IMAX | $22.99 | $11.50 |
| Dolby Cinema | $22.99 | $11.50 |

Note: 3D, Prime, and ScreenX are available as format options but not seeded with default prices. Users can add custom formats/prices in settings.

### Discount Days
- `id` (uuid, PK)
- `user_id` (FK)
- `day_of_week` (integer, 0=Sun, 2=Tue, 3=Wed)

Default: Tuesday (2), Wednesday (3). Editable in settings.

### Movies
- `id` (uuid, PK)
- `user_id` (FK)
- `title`
- `tmdb_id` (nullable — for linking to TMDB data)
- `watched_date`
- `venue_type` (enum: amc, other_theater, home)
- `amc_location_id` (FK, nullable — only for amc venue_type)
- `format` (enum, nullable — only for amc venue_type)
- `is_discount_day` (boolean, default false)
- `ticket_value` (decimal, computed — what the ticket would have cost)
- `letterboxd_rating` (decimal, nullable — user's rating from Letterboxd)
- `letterboxd_avg_rating` (decimal, nullable — community average)
- `letterboxd_url` (nullable)
- `source` (enum: letterboxd_sync, manual)
- `created_at`

`ticket_value` is computed on save based on format + is_discount_day + the user's pricing config.

## App Structure

### Bottom Navigation (4 tabs)
1. **Home** — savings dashboard
2. **Sync** — Letterboxd sync + manual entry
3. **Stats** — deeper insights
4. **Simulate** — friend calculator

### Home Screen

**Layout (top to bottom):**

1. **Time range pills** — horizontally scrollable: This Month, 90 Days, YTD, All Time, Custom. All data on the page updates when you switch ranges.

2. **Savings hero** — centered, moderate size:
   - "Total Saved" label
   - Dollar amount in green (e.g. $47.50)
   - Movie count for the selected range

3. **Break-even comparison** — side-by-side cards:
   - Left card: "You Paid" — membership cost in red
   - Right card: "Ticket Value" — sum of ticket values in green
   - Below: "Net Savings" banner with the difference (+$22.51 in green, or -$X in red if underwater)

4. **Quick stats row** — 3 small cards:
   - Movies (count)
   - Avg Rating (from Letterboxd)
   - Avg Ticket (average ticket value)

5. **Recent movies list** — AMC movies only, sorted by date desc. Each row shows:
   - Movie title
   - Date, format, AMC location
   - Letterboxd rating (star icon)
   - Savings amount (+$XX in green)

**Key behaviors:**
- When time range changes, savings hero, break-even, stats, and movie list all update
- Home only shows AMC movies — non-AMC movies exist in the DB but are filtered out here
- If net savings is negative (below break-even), the net savings banner turns red
- "Custom" range opens a date picker

### Sync Tab

**Two entry points:**
1. **Sync from Letterboxd** button — pulls recent diary entries from the user's Letterboxd RSS feed
2. **Add manually** button — opens the same bottom sheet flow but with a movie search field

**Letterboxd sync flow:**
1. User hits "Sync from Letterboxd"
2. App fetches RSS feed, parses diary entries, deduplicates against existing movies
3. Shows list of new movies found
4. Each movie is untagged — shows title, date, and Letterboxd rating
5. User selects a movie → **bottom sheet** slides up

**Bottom sheet (shared by sync + manual entry):**
- **Movie info** at top (title, date, rating)
- **"Where did you see this?"** — three large buttons: AMC Theater / Other Theater / Home
- If AMC selected:
  - **Format selector** — wrapping button grid (Standard, IMAX, Dolby Cinema, plus any custom formats the user adds)
  - **Location selector** — dropdown showing recently used AMC locations, option to add new
  - **Discount day toggle** — "Discount day (Tue/Wed)?" with on/off toggle, note about half-price
- If Other Theater or Home: sheet saves and dismisses immediately, no extra fields
- **Save button**

**Manual entry additions (when not coming from Letterboxd):**
- **Movie search field** at top of sheet — autocomplete powered by TMDB API
- **Date picker** — when did you watch it
- Rest of the flow is identical

### Stats Tab

**Single scrollable page with time range filter at top (All Time / Custom).**

**Sections (top to bottom):**

1. **Savings over time** — line chart showing cumulative savings trending upward. X-axis is time, Y-axis is dollars.

2. **Monthly breakdown** — horizontal bar chart, one row per month. Shows savings amount + movie count. Bar color: green if that month's ticket value exceeded membership cost, red if not.

3. **Letterboxd insights:**
   - Three stat cards: Your Avg Rating, Letterboxd Avg Rating, Difference
   - Rating distribution bar chart (1-5 stars)

4. **Formats & locations:**
   - Format breakdown — count per format (Dolby: 8, IMAX: 5, etc.)
   - Location breakdown — list of AMC locations with visit counts, sorted by most visited

### Simulate Tab

**"Would A-List save you money?" calculator for non-members.**

**Flow:**
1. **"Is there an AMC near you?"** — zip code input or simple Yes/No
   - If no → short-circuit: "A-List requires an AMC theater nearby. It probably isn't for you."
2. **"How many movies do you see in theaters per month?"** — slider, 1-8+
3. **"What format do you usually pick?"** — Standard / IMAX / Dolby / Mix
4. **"Do you usually go on discount days (Tue/Wed)?"** — toggle
5. **Results:**
   - "You'd spend ~$X/month on tickets"
   - "A-List costs $25.99/month"
   - "You'd save $X/month ($X/year)" or "A-List isn't worth it — you'd overpay by $X/month"
   - Honest either way

No account needed to use the simulator. Shareable via URL.

### Settings

- **Letterboxd username** — text input, used for sync
- **Membership cost** — decimal input, default $25.99
- **Format pricing** — editable table of regular + discount prices per format
- **AMC locations** — manage saved locations (add/remove)
- **Discount days** — which days of the week are half-price (default: Tue, Wed)

## PWA Configuration

- Service worker for offline access (read-only — viewing cached data)
- Web app manifest with app name, icon, theme color (dark)
- Installable on iOS Safari home screen
- Standalone display mode (no browser chrome)

## Auth

Simple Supabase auth — email/password or magic link. Lightweight, just enough to tie data to a user. No social logins needed for v1.

## Letterboxd Integration Details

Letterboxd has no official public API. Every public profile exposes an RSS feed at:
`https://letterboxd.com/USERNAME/rss/`

The RSS feed contains diary entries with:
- Movie title
- Watch date
- User's star rating
- Letterboxd URL for the film

For average community ratings, we can scrape the individual film page or use TMDB ratings as a proxy.

**Sync behavior:**
- On-demand only (user hits Sync button)
- Deduplicates by title + watched_date
- New entries appear as untagged in the triage list
- Already-synced movies are skipped

## Edge Cases

- **No movies this month:** Home screen shows $0 saved, net savings is -$25.99 (red). This is honest and motivating.
- **Custom date range spanning partial months:** Pro-rate the membership cost (e.g. 15 days = ~$12.50 membership cost for break-even calculation).
- **Discount day toggle forgotten:** Default is off. The app could auto-detect based on the watched_date's day of week and pre-fill the toggle, but let the user override.
- **Duplicate movies:** If a movie is synced from Letterboxd and also manually entered with the same title + date, flag it during manual entry: "This movie was already logged on [date]. Add anyway?"
- **Letterboxd username changed:** Just update in settings, next sync uses the new username.

## Out of Scope (v1)

- Push notifications
- Social features / sharing stats (beyond the simulator)
- Movie recommendations
- Multiple membership tracking (e.g. tracking for a partner)
- Import/export data
- Native app wrapper (Capacitor/Expo)
