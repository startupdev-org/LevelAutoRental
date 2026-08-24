-- ============================================================================
-- Link seed "Profiles" to the real Auth user id (same email).
-- Run AFTER the user exists in auth.users (sign up or Dashboard → Add user).
--
-- Why: useAuth loads Profiles WHERE id = auth.uid(). Seed UUIDs rarely match a new
-- Auth user. scripts/rls_profiles_admin_and_related.sql also allows SELECT by JWT
-- email, but syncing ids avoids subtle bugs (updates targeting profile id).
--
-- Replace v_email if your admin uses another address.
-- ============================================================================

DO $$
DECLARE
  v_email text := 'levelauto@admin.com';
  v_new_id text;
  v_old_id text;
BEGIN
  SELECT id::text INTO v_new_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_new_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for email %. Sign in or create the user first.', v_email;
  END IF;

  SELECT id INTO v_old_id FROM public."Profiles" WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_old_id IS NULL THEN
    RAISE EXCEPTION 'No public."Profiles" row for email %.', v_email;
  END IF;

  IF v_old_id = v_new_id THEN
    RAISE NOTICE 'Profiles.id already matches auth.users.id for %.', v_email;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public."Profiles" WHERE id = v_new_id) THEN
    RAISE EXCEPTION 'Profiles id % already exists. Remove duplicate profile row or merge manually.', v_new_id;
  END IF;

  -- Free unique(email): cannot INSERT the new row while the old row still holds that email.
  UPDATE public."Profiles"
  SET email = '__migrating__' || replace(v_old_id::text, '-', '') || '@invalid.local'
  WHERE id = v_old_id;

  -- New profile row with Auth id (FK children can reference it); restore real email
  INSERT INTO public."Profiles" (
    id, first_name, last_name, email, phone_number, role, created_at, updated_at
  )
  SELECT
    v_new_id, first_name, last_name, v_email, phone_number, role, created_at, now()
  FROM public."Profiles"
  WHERE id = v_old_id;

  UPDATE public."Rentals" SET user_id = v_new_id WHERE user_id = v_old_id;
  UPDATE public."BorrowRequest" SET user_id = v_new_id WHERE user_id = v_old_id;

  DELETE FROM public."Profiles" WHERE id = v_old_id;

  RAISE NOTICE 'Linked %: removed profile %, now using auth id %', v_email, v_old_id, v_new_id;
END $$;
