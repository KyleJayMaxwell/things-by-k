-- ─────────────────────────────────────────────
-- Things by K — Sales Tax
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql, then run create-order.sql again (safe to run more than once)
--
-- Stripe Tax adds sales tax at checkout. Each order keeps the tax it collected
-- so the admin, the customer's account page and the CSV export can show it.
-- Orders from before sales tax have 0.
-- ─────────────────────────────────────────────

alter table public.orders
  add column if not exists tax integer not null default 0;  -- in cents
