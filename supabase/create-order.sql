-- ─────────────────────────────────────────────
-- Things by K — Create Order Function
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql, decrement-stock.sql, refunds.sql,
-- handwritten-option.sql and sales-tax.sql (safe to run more than once)
--
-- The Stripe webhook saves a paid order with this one call. The order, every
-- item and the stock changes happen in one transaction, so an order can never
-- be saved with missing items: either all of it lands or none of it does and
-- Stripe retries. A retry for an order that already exists changes nothing.
-- ─────────────────────────────────────────────

create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns jsonb as $$
declare
  v_order public.orders;
  v_item jsonb;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'create_order: order % has no items', p_order->>'stripe_session_id';
  end if;

  -- Stripe can deliver the same event twice at once; let one finish first
  perform pg_advisory_xact_lock(hashtext(p_order->>'stripe_session_id'));

  select * into v_order from public.orders
  where stripe_session_id = p_order->>'stripe_session_id';
  if found then
    return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'created', false);
  end if;

  insert into public.orders (
    order_number, user_id, email, stripe_session_id, stripe_payment_intent,
    status, subtotal, shipping_cost, tax, total, shipping_address
  ) values (
    public.generate_order_number(),
    nullif(p_order->>'user_id', '')::uuid,
    p_order->>'email',
    p_order->>'stripe_session_id',
    p_order->>'stripe_payment_intent',
    'processing',
    (p_order->>'subtotal')::integer,
    (p_order->>'shipping_cost')::integer,
    coalesce((p_order->>'tax')::integer, 0),
    (p_order->>'total')::integer,
    p_order->'shipping_address'
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, product_id, product_name, price, quantity, handwritten_message)
    values (
      v_order.id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'price')::integer,
      (v_item->>'quantity')::integer,
      nullif(v_item->>'handwritten_message', '')
    );
    perform public.decrement_stock((v_item->>'product_id')::uuid, (v_item->>'quantity')::integer);
  end loop;

  return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'created', true);
end;
$$ language plpgsql;

-- Only the webhook (service role) may create orders
revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
