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
