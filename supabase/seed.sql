-- ─────────────────────────────────────────────
-- Things by K — Seed Data
-- Run this AFTER schema.sql
-- Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────

-- ── MVP Product: 1 Postcard ───────────────────────────────────────────────────
-- Update the `images` array once you've uploaded your photo to Supabase Storage.
-- Path convention: product-images/sunset-postcard/main.jpg

insert into public.products (
  name,
  slug,
  description,
  long_description,
  price,
  currency,
  category,
  images,
  stock,
  is_active
) values (
  'Sunset Postcard',
  'sunset-postcard',
  'An original photograph printed on premium postcard stock. Ready to send or frame.',
  'Captured during golden hour on the coast, this photograph is printed on thick 350gsm matte postcard stock. The warm tones and soft light make it equally at home in an envelope or in a frame. Each postcard is 4×6 inches and ships in a protective sleeve.

Details:
- Size: 4×6 inches (standard postcard)
- Paper: 350gsm matte
- Printed in the USA
- Ships within 3–5 business days',
  500,      -- $5.00
  'usd',
  'postcard',
  array[
    -- Replace with your actual Supabase Storage public URLs after uploading
    -- Format: https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/product-images/sunset-postcard/main.jpg
    'https://placehold.co/800x600/360F5A/FFFFFF?text=Sunset+Postcard'
  ],
  50,       -- starting stock
  true
);
