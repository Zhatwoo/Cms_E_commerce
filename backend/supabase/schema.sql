-- ============================================================
-- Supabase Schema — CMS E-commerce
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- 0. Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- 1. Custom Enums
-- ============================================================
create type user_role as enum ('admin', 'support', 'client', 'super_admin');
create type subscription_tier as enum ('free', 'pro', 'enterprise', 'internal_admin');

-- ============================================================
-- 2. PROFILES  (mirrors auth.users — holds app data)
--    Auto-created by trigger when a user signs up
-- ============================================================
create table public.profiles (
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

create index idx_profiles_email  on public.profiles (email);
create index idx_profiles_role   on public.profiles (role);
create index idx_profiles_status on public.profiles (status);

-- ============================================================
-- 3. TEMPLATES  (site template library)
-- ============================================================
create table public.templates (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null default '',
  description    text        not null default '',
  slug           text        unique,
  preview_image  text,
  coming_soon    boolean     not null default false,
  sort_order     int         not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_templates_slug on public.templates (slug);

-- ============================================================
-- 4. PRODUCTS  (e-commerce catalog)
-- ============================================================
create table public.products (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null default '',
  slug             text        unique,
  description      text        not null default '',
  price            numeric     not null default 0,
  compare_at_price numeric,
  images           jsonb       not null default '[]'::jsonb,
  status           text        not null default 'Draft',
  stock            int,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_products_slug   on public.products (slug);
create index idx_products_status on public.products (status);

-- ============================================================
-- 5. POSTS  (blog / news)
--    author_id → profiles.id
-- ============================================================
create table public.posts (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null default '',
  slug            text        unique,
  excerpt         text        not null default '',
  content         text        not null default '',
  status          text        not null default 'Draft',
  featured_image  text,
  author_id       uuid        references public.profiles(id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_posts_slug   on public.posts (slug);
create index idx_posts_status on public.posts (status);
create index idx_posts_author on public.posts (author_id);

-- ============================================================
-- 6. PAGES  (CMS pages)
--    created_by → profiles.id
-- ============================================================
create table public.pages (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null default '',
  slug         text        unique,
  content      text        not null default '',
  status       text        not null default 'Draft',
  created_by   uuid        references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_pages_slug   on public.pages (slug);
create index idx_pages_status on public.pages (status);

-- ============================================================
-- 7. ORDERS  (e-commerce orders)
--    user_id → profiles.id
-- ============================================================
create table public.orders (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references public.profiles(id) on delete set null,
  items            jsonb       not null default '[]'::jsonb,
  total            numeric     not null default 0,
  status           text        not null default 'Pending',
  shipping_address jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_orders_user   on public.orders (user_id);
create index idx_orders_status on public.orders (status);

-- ============================================================
-- 8. DOMAINS  (custom domain mapping per user)
--    user_id → profiles.id
-- ============================================================
create table public.domains (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.profiles(id) on delete cascade,
  domain       text        unique not null,
  status       text        not null default 'Pending',
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_domains_user   on public.domains (user_id);
create index idx_domains_domain on public.domains (domain);

-- ============================================================
-- 9. PASSWORD RESETS  (time-limited tokens)
--    user_id → profiles.id
-- ============================================================
create table public.password_resets (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.profiles(id) on delete cascade,
  email        text        not null,
  token        text        unique not null,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index idx_pw_reset_token on public.password_resets (token);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ── PROFILES ────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- ── TEMPLATES ───────────────────────────────────────────────
alter table public.templates enable row level security;

create policy "Anyone can read templates"
  on public.templates for select using (true);

create policy "Admins can manage templates"
  on public.templates for all
  using (public.is_admin());

-- ── PRODUCTS ────────────────────────────────────────────────
alter table public.products enable row level security;

create policy "Anyone can read products"
  on public.products for select using (true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin());

-- ── POSTS ───────────────────────────────────────────────────
alter table public.posts enable row level security;

create policy "Anyone can read published posts"
  on public.posts for select
  using (status = 'Published' or auth.uid() is not null);

create policy "Authenticated users can manage posts"
  on public.posts for all
  using (auth.uid() is not null);

-- ── PAGES ───────────────────────────────────────────────────
alter table public.pages enable row level security;

create policy "Anyone can read published pages"
  on public.pages for select
  using (status = 'Published' or auth.uid() is not null);

create policy "Authenticated users can manage pages"
  on public.pages for all
  using (auth.uid() is not null);

-- ── ORDERS ──────────────────────────────────────────────────
alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (public.is_admin());

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_admin());

-- ── DOMAINS ─────────────────────────────────────────────────
alter table public.domains enable row level security;

create policy "Users can view own domains"
  on public.domains for select
  using (auth.uid() = user_id);

create policy "Admins can view all domains"
  on public.domains for select
  using (public.is_admin());

create policy "Users can manage own domains"
  on public.domains for all
  using (auth.uid() = user_id);

create policy "Admins can manage domains"
  on public.domains for all
  using (public.is_admin());

-- ── PASSWORD RESETS ─────────────────────────────────────────
alter table public.password_resets enable row level security;
-- Backend only (service role key bypasses RLS)

-- ============================================================
-- 11. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'profiles','templates','products','posts',
      'pages','orders','domains'
    ])
  loop
    execute format(
      'create trigger trg_%I_updated_at '
      'before update on public.%I '
      'for each row execute function public.handle_updated_at();',
      tbl, tbl
    );
  end loop;
end;
$$;

-- ============================================================
-- 12. AUTO-CREATE PROFILE ON SIGNUP (Trigger on auth.users)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _role user_role := 'client';
  _raw_role text;
  _full_name text := '';
  _avatar_url text;
  _meta jsonb;
begin
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
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
