-- Run in Supabase SQL Editor if profiles table or enums are missing.
-- (Use when trigger fails with "relation public.profiles does not exist" or type errors.)

-- Enums (ignore errors if they already exist)
do $$ begin create type user_role as enum ('admin', 'support', 'client', 'super_admin'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_tier as enum ('free', 'pro', 'enterprise', 'internal_admin'); exception when duplicate_object then null; end $$;

-- Profiles table (exact columns the trigger inserts into)
create table if not exists public.profiles (
  id                 uuid        not null references auth.users on delete cascade primary key,
  email              text        not null,
  full_name          text        not null default '',
  avatar_url         text,
  phone              text,
  bio                text        default '',
  username           text        default '',
  website            text        default '',
  role               user_role   not null default 'client',
  subscription_plan  subscription_tier not null default 'free',
  status             text        not null default 'active',
  is_active          boolean     not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
