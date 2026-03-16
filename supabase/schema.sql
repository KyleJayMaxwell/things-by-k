-- ─────────────────────────────────────────────
-- Things by K — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────


-- ── 1. PRODUCTS ───────────────────────────────────────────────────────────────

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text not null,
  long_description text not null,
  price            integer not null,        -- in cents, e.g. 500 = $5.00
  currency         text not null default 'usd',
  category         text not null check (category in ('postcard', 'necklace', 'zine')),
  images           text[] not null default '{}', -- Supabase Storage URLs
  stock            integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at on change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();


-- ── 2. ORDERS ─────────────────────────────────────────────────────────────────

create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  order_number           text not null unique,
  user_id                uuid references auth.users(id) on delete set null,
  email                  text not null,
  stripe_session_id      text not null unique,
  stripe_payment_intent  text not null,
  status                 text not null default 'processing'
                           check (status in ('processing', 'shipped', 'delivered')),
  subtotal               integer not null,   -- in cents
  shipping_cost          integer not null,   -- in cents
  total                  integer not null,   -- in cents
  shipping_address       jsonb not null,
  created_at             timestamptz not null default now()
);


-- ── 3. ORDER ITEMS ────────────────────────────────────────────────────────────

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete restrict,
  product_name text not null,    -- snapshot at time of purchase
  price        integer not null, -- snapshot in cents
  quantity     integer not null check (quantity > 0)
);


-- ── 4. PROFILES ───────────────────────────────────────────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 5. ORDER NUMBER SEQUENCE ──────────────────────────────────────────────────
-- Generates TBK-00001, TBK-00002, etc.

create sequence public.order_number_seq start 1;

create or replace function public.generate_order_number()
returns text as $$
begin
  return 'TBK-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
end;
$$ language plpgsql;


-- ── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles   enable row level security;

-- products: anyone can read active products; only service role can write
create policy "Public can view active products"
  on public.products for select
  using (is_active = true);

-- orders: users can read their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- order_items: users can read items belonging to their own orders
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- profiles: users can read and update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
