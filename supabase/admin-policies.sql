-- ─────────────────────────────────────────────
-- Things by K — Admin Policies
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql and storage.sql (safe to run more than once)
--
-- The admin dashboard talks to Supabase from the browser as the signed-in
-- admin, so RLS needs to let that user manage products, upload images and
-- see every order. Keep the email in sync with src/lib/admin.ts.
-- ─────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'kylejaymaxwell@gmail.com'
$$ language sql stable;

-- products: admin can see inactive products and create/edit/delete
drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- orders + order_items: admin can see everything (status updates go through
-- /api/admin/orders/[id], which uses the service role)
drop policy if exists "Admin can view all orders" on public.orders;
create policy "Admin can view all orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admin can view all order items" on public.order_items;
create policy "Admin can view all order items"
  on public.order_items for select
  using (public.is_admin());

-- product-images bucket: admin can upload, replace and delete
drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin can update product images" on storage.objects;
create policy "Admin can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Admin can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
