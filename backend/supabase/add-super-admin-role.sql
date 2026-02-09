-- Add super_admin to user_role enum. Run once in Supabase SQL Editor.
-- (For new projects, schema.sql and ensure-profiles.sql already include super_admin in the enum.)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;
