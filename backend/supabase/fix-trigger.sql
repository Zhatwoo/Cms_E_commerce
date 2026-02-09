-- ============================================================
-- FIX: Re-create the handle_new_user trigger function + RLS for signup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor → New query → Paste → Run
--
-- If registration STILL fails: run drop-auth-trigger.sql instead. That removes the trigger
-- and the backend will create the profile row after signup (registration will work).
-- ============================================================

-- One-off: table to capture trigger errors (drop after debugging)
create table if not exists public._trigger_debug (
  id serial primary key,
  err_state text,
  err_msg text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  _role user_role := 'client';
  _raw_role text;
  _full_name text := '';
  _avatar_url text;
  _meta jsonb;
begin
  -- Run as definer (postgres); bypass RLS for this transaction so insert always succeeds
  set local search_path = public;
  set local row_security = off;

  _meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  _full_name := coalesce(nullif(trim(_meta->>'full_name'), ''), '');
  _avatar_url := nullif(trim(_meta->>'avatar_url'), '');

  begin
    _raw_role := nullif(trim(coalesce(_meta->>'role', '')), '');
    if _raw_role is not null then
      _role := _raw_role::user_role;
    end if;
  exception when others then
    _role := 'client';
  end;

  insert into public.profiles (
    id, email, full_name, avatar_url, role, subscription_plan
  ) values (
    new.id,
    new.email,
    _full_name,
    _avatar_url,
    _role,
    'free'::subscription_tier
  );
  return new;
exception when others then
  insert into public._trigger_debug (err_state, err_msg)
  values (sqlstate, sqlerrm);
  raise;
end;
$$ language plpgsql security definer;

-- RLS: allow profile insert when the row id matches the current auth user (trigger runs in signup context)
alter table public.profiles enable row level security;
drop policy if exists "Allow profile insert on signup" on public.profiles;
create policy "Allow profile insert on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Ensure trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fallback: allow auth service to insert (ignore errors if role doesn't exist)
do $$
begin
  grant usage on schema public to supabase_auth_admin;
  grant insert on public.profiles to supabase_auth_admin;
exception when others then
  null;
end $$;

-- Optional: remove orphaned auth users (no profile) so you can re-use the same email
-- delete from auth.users where id not in (select id from public.profiles);
