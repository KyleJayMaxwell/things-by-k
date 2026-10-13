-- ─────────────────────────────────────────────
-- Things by K — Surprise Me Postcard
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql, handwritten-option.sql and admin-policies.sql
-- (safe to run more than once)
-- ─────────────────────────────────────────────

-- Marks the mystery listing. The admin order page shows a "Design sent"
-- picker for its items, and shop filters leave it out.
alter table public.products
  add column if not exists is_surprise boolean not null default false;

-- What the buyer chose on the Surprise me card
alter table public.order_items
  add column if not exists surprise_preference text,              -- optional "any preference?" note
  add column if not exists is_gift             boolean not null default false,  -- gift: shipped email names the design
  add column if not exists same_design         boolean not null default false;  -- qty > 1: every card the same design

-- The design actually sent for each card of a Surprise me item (slot 0, 1, 2...
-- up to quantity - 1). Its own table, readable only by the admin, so a buyer
-- can't look up their design before it arrives.
create table if not exists public.surprise_picks (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  slot          integer not null check (slot >= 0),
  product_id    uuid not null references public.products(id) on delete restrict,
  product_name  text not null,   -- snapshot, like order_items.product_name
  created_at    timestamptz not null default now(),
  unique (order_item_id, slot)
);

alter table public.surprise_picks enable row level security;

drop policy if exists "Admin can view surprise picks" on public.surprise_picks;
create policy "Admin can view surprise picks"
  on public.surprise_picks for select
  using (public.is_admin());

-- Puts stock back when a pick is changed or an unshipped order is refunded
create or replace function public.increment_stock(p_product_id uuid, p_quantity integer)
returns void as $$
begin
  update public.products
  set stock = stock + p_quantity
  where id = p_product_id;
end;
$$ language plpgsql security definer;

-- Only the server (service role) should change stock
revoke execute on function public.increment_stock(uuid, integer) from public, anon, authenticated;
