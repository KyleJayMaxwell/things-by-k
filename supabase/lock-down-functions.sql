-- ─────────────────────────────────────────────
-- Things by K — Lock Down Server-Only Functions
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql and decrement-stock.sql (safe to run more than once)
--
-- Postgres lets everyone run a new function, and Supabase also grants it to
-- anon and authenticated. The public anon key ships in the browser, so without
-- this anyone could call rpc('decrement_stock') to zero stock or burn order
-- numbers. Only the Stripe webhook (service role) should call these.
-- ─────────────────────────────────────────────

revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;

revoke execute on function public.generate_order_number() from public, anon, authenticated;
grant execute on function public.generate_order_number() to service_role;
