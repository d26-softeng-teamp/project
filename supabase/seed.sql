-- Local development only — runs after migrations on `supabase db reset`.
-- Creates two Auth users; `on_auth_user_created` also inserts `public.users`.
-- Keep in sync with `apps/api/prisma/ensure-demo-users.ts` (Prisma db seed).
--
-- | Email               | Role / purpose        | Password          |
-- |---------------------|----------------------|-------------------|
-- | admin@hanover.test  | Demo admin account   | HanoverTest123!   |
-- | user@hanover.test   | Demo standard user   | HanoverTest123!   |
--
-- `user_metadata` seeds `public.users` (portal, role, employee_code, job_desc) via handle_new_user.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  admin_id uuid := 'a0000001-0000-4000-8000-000000000001';
  user_id uuid := 'a0000002-0000-4000-8000-000000000002';
  dev_pw text := crypt('HanoverTest123!', gen_salt('bf'));
BEGIN
  -- Demo admin
  -- Token columns must be '' not NULL or GoTrue fails with "Database error querying schema"
  -- when scanning users (see supabase/auth#1940).
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@hanover.test',
    dev_pw,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Test Admin","portal":"admin","role":"admin","employee_code":"ADM001","job_desc":"Administrator"}'::jsonb,
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    admin_id,
    format('{"sub":"%s","email":"admin@hanover.test"}', admin_id)::jsonb,
    'email',
    admin_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- Demo standard user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user@hanover.test',
    dev_pw,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Test User","portal":"employee","role":"underwriter","employee_code":"EMP001","job_desc":"Underwriter"}'::jsonb,
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    user_id,
    format('{"sub":"%s","email":"user@hanover.test"}', user_id)::jsonb,
    'email',
    user_id::text,
    NOW(),
    NOW(),
    NOW()
  );
END $$;
