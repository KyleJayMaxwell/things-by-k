-- ─────────────────────────────────────────────
-- Things by K — Order Tracking Columns
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql (safe to run more than once)
-- ─────────────────────────────────────────────

-- Filled in from the admin order page when an order is marked shipped
alter table public.orders
  add column if not exists carrier         text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at      timestamptz;
