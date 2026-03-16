-- ─────────────────────────────────────────────
-- Things by K — Storage Setup
-- Run this AFTER schema.sql
-- Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────

-- Create the product-images bucket (public so images load in the storefront)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

-- Allow anyone to read images (public bucket)
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only service role can upload/delete images (you'll do this from the dashboard)
-- No additional policy needed — service role bypasses RLS by default
