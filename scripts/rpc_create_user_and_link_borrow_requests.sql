-- ============================================================================
-- RPC used by signup: src/lib/db/auth/auth.ts → createUser()
-- Run in Supabase SQL Editor (service role client calls this).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_and_link_borrow_requests(
  p_id text,
  p_first_name character varying(50),
  p_last_name character varying(50),
  p_email character varying(255),
  p_phone_number character varying(50),
  p_role character varying(50)
)
RETURNS SETOF public."Profiles"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."Profiles" (id, first_name, last_name, email, phone_number, role, created_at, updated_at)
  VALUES (
    p_id,
    COALESCE(NULLIF(btrim(p_first_name::text), ''), '-'),
    COALESCE(NULLIF(btrim(p_last_name::text), ''), '-'),
    btrim(p_email::text),
    NULLIF(btrim(COALESCE(p_phone_number, '')::text), ''),
    COALESCE(NULLIF(btrim(COALESCE(p_role, '')::text), ''), 'USER'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    updated_at = now();

  UPDATE public."BorrowRequest"
  SET user_id = p_id, updated_at = now()
  WHERE user_id IS NULL
    AND customer_email IS NOT NULL
    AND lower(btrim(customer_email::text)) = lower(btrim(p_email::text));

  RETURN QUERY SELECT * FROM public."Profiles" WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_and_link_borrow_requests(
  text, character varying, character varying, character varying, character varying, character varying
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_user_and_link_borrow_requests(
  text, character varying, character varying, character varying, character varying, character varying
) TO service_role;
