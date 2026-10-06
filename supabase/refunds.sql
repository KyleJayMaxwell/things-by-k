-- ─────────────────────────────────────────────
-- Things by K — Refunds
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql (safe to run more than once)
-- ─────────────────────────────────────────────

-- Allow a "refunded" order status
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('processing', 'shipped', 'delivered', 'refunded'));

-- Filled in when an order is refunded (from the admin page or the Stripe dashboard)
alter table public.orders
  add column if not exists refunded_at   timestamptz,
  add column if not exists refund_amount integer;  -- in cents
