-- ─────────────────────────────────────────────
-- Things by K — Stock Decrement Function
-- Add this to Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql
-- ─────────────────────────────────────────────

-- Called by the Stripe webhook after a successful purchase
create or replace function public.decrement_stock(p_product_id uuid, p_quantity integer)
returns void as $$
begin
  update public.products
  set stock = greatest(0, stock - p_quantity)
  where id = p_product_id;
end;
$$ language plpgsql security definer;
