-- ─────────────────────────────────────────────
-- Things by K — Handwritten Postcard Option
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql (safe to run more than once)
-- ─────────────────────────────────────────────

-- Extra price (cents) for having a postcard handwritten. Every postcard
-- offers it; null or 0 = no extra charge.
alter table public.products
  add column if not exists handwritten_price integer
    check (handwritten_price is null or handwritten_price >= 0);

-- The note the customer asked to have written on the card
alter table public.order_items
  add column if not exists handwritten_message text;
