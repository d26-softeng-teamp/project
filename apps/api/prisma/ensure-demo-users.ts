import type { PrismaClient } from "@prisma/client";

/** Matches `supabase/seed.sql` — stable ids for demo Auth + `public.users`. */
export const DEMO_ADMIN_EMAIL = "admin@hanover.test" as const;
export const DEMO_USER_EMAIL = "user@hanover.test" as const;

const ADMIN_ID = "a0000001-0000-4000-8000-000000000001";
const USER_ID = "a0000002-0000-4000-8000-000000000002";

/**
 * Same data as `supabase/seed.sql`: `auth.users`, `auth.identities`, then `public.users`
 * (trigger fills profile on first insert; upsert keeps rows aligned on re-seed).
 */
export async function ensureDemoAuthAndProfiles(prisma: PrismaClient) {
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  } catch {
    // Supabase usually ships pgcrypto already; ignore permission / duplicate errors.
  }

  await prisma.$executeRawUnsafe(`
DO $$
DECLARE
  admin_id uuid := '${ADMIN_ID}'::uuid;
  user_id uuid := '${USER_ID}'::uuid;
  dev_pw text;
BEGIN
  dev_pw := crypt('HanoverTest123!', gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    admin_id, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', '${DEMO_ADMIN_EMAIL}',
    dev_pw, NOW(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Test Admin","portal":"admin","role":"admin","employee_code":"ADM001","job_desc":"Administrator"}'::jsonb,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', '${DEMO_ADMIN_EMAIL}'),
    'email', admin_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    user_id = EXCLUDED.user_id,
    updated_at = NOW();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    user_id, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', '${DEMO_USER_EMAIL}',
    dev_pw, NOW(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Test User","portal":"employee","role":"underwriter","employee_code":"EMP001","job_desc":"Underwriter"}'::jsonb,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), user_id,
    jsonb_build_object('sub', user_id::text, 'email', '${DEMO_USER_EMAIL}'),
    'email', user_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    user_id = EXCLUDED.user_id,
    updated_at = NOW();
END $$;
`);

  await prisma.userProfile.upsert({
    where: { id: ADMIN_ID },
    create: {
      id: ADMIN_ID,
      email: DEMO_ADMIN_EMAIL,
      name: "Test Admin",
      portal: "admin",
      role: "admin",
      employee_code: "ADM001",
      job_desc: "Administrator",
    },
    update: {
      email: DEMO_ADMIN_EMAIL,
      name: "Test Admin",
      portal: "admin",
      role: "admin",
      employee_code: "ADM001",
      job_desc: "Administrator",
    },
  });

  await prisma.userProfile.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      email: DEMO_USER_EMAIL,
      name: "Test User",
      portal: "employee",
      role: "underwriter",
      employee_code: "EMP001",
      job_desc: "Underwriter",
    },
    update: {
      email: DEMO_USER_EMAIL,
      name: "Test User",
      portal: "employee",
      role: "underwriter",
      employee_code: "EMP001",
      job_desc: "Underwriter",
    },
  });

  console.log(`[seed] Demo Auth + profiles: ${DEMO_ADMIN_EMAIL}, ${DEMO_USER_EMAIL}`);
}
