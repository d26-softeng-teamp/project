-- Add actuarial-analyst and exl-operations roles.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN ('admin', 'underwriter', 'business-analyst', 'actuarial-analyst', 'exl-operations')
  );

-- Update handle_new_user to accept the new roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_portal text;
  v_role text;
  v_code text;
BEGIN
  v_portal := CASE WHEN new.raw_user_meta_data->>'portal' = 'admin' THEN 'admin' ELSE 'employee' END;
  v_role := new.raw_user_meta_data->>'role';
  IF v_role IS NULL OR v_role NOT IN ('admin', 'underwriter', 'business-analyst', 'actuarial-analyst', 'exl-operations') THEN
    v_role := 'underwriter';
  END IF;
  v_code := nullif(trim(coalesce(new.raw_user_meta_data->>'employee_code', '')), '');
  IF v_code IS NOT NULL AND length(v_code) > 10 THEN
    v_code := left(v_code, 10);
  END IF;

  INSERT INTO public.users (id, email, name, portal, role, employee_code, job_desc)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_portal,
    v_role,
    v_code,
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'job_desc', '')), 200), '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
