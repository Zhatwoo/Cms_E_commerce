-- Run this in Supabase SQL Editor if registration still fails with "Database trigger error".
-- This removes the trigger so signup succeeds; the backend will create the profile row instead.
-- https://supabase.com/dashboard → your project → SQL Editor → New query → Paste → Run

drop trigger if exists on_auth_user_created on auth.users;
