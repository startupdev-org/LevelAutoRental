-- First, ensure the is_admin() function exists (reuse from borrow_request setup or create)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public."Profiles"
        WHERE id = auth.uid()::text
        AND role = 'ADMIN'
    );
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Policy: Admins can view all profiles
-- This allows admins to SELECT all profiles regardless of id
DROP POLICY IF EXISTS "Admins can view all profiles" ON public."Profiles";
CREATE POLICY "Admins can view all profiles"
ON public."Profiles"
FOR SELECT
USING (
    public.is_admin()
);

-- Policy: Admins can update all profiles
-- This allows admins to UPDATE any profile regardless of id
DROP POLICY IF EXISTS "Admins can update all profiles" ON public."Profiles";
CREATE POLICY "Admins can update all profiles"
ON public."Profiles"
FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

