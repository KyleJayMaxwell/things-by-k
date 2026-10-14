-- ─────────────────────────────────────────────
-- Things by K — Shop filters and search
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql (safe to run more than once)
-- ─────────────────────────────────────────────

-- Places a product is from or shows, e.g. {San Francisco, Bay Area, North Beach}
alter table public.products
  add column if not exists locations text[] not null default '{}';

-- Postcard orientation; null for products where it doesn't apply
alter table public.products
  add column if not exists orientation text
    check (orientation is null or orientation in ('horizontal', 'vertical'));

-- Lowercased name + descriptions + locations, kept up to date by the trigger
-- below, so shop search is one ilike per word
alter table public.products
  add column if not exists search_text text not null default '';

create or replace function public.products_set_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(
    coalesce(new.name, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.long_description, '') || ' ' ||
    array_to_string(coalesce(new.locations, '{}'), ' ')
  );
  return new;
end;
$$;

drop trigger if exists products_search_text on public.products;
create trigger products_search_text
  before insert or update on public.products
  for each row execute function public.products_set_search_text();

-- Fill search_text for products that already exist
update public.products set name = name;

create index if not exists products_locations_idx on public.products using gin (locations);
create index if not exists products_category_active_idx on public.products (category, is_active, created_at desc);
