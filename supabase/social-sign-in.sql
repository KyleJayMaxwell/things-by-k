-- ─────────────────────────────────────────────
-- Things by K — Google and magic link sign-in
-- Supabase Dashboard → SQL Editor
-- Run AFTER schema.sql (safe to run more than once)
-- ─────────────────────────────────────────────

-- Fill in the profile's first name for Google sign-ups too.
-- Email sign-up sends first_name; Google sends given_name / full_name.
-- Magic link sign-ups have no name yet, so they stay blank.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'first_name', ''),
      nullif(new.raw_user_meta_data->>'given_name', ''),
      nullif(split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1), ''),
      ''
    )
  );
  return new;
end;
$$ language plpgsql security definer;
