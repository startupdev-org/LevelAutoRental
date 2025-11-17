-- Enable Row Level Security on Profiles table (if not already enabled)
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own profile" ON public."Profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON public."Profiles";
DROP POLICY IF EXISTS "Admins can view all profiles" ON public."Profiles";
DROP POLICY IF EXISTS "Admins can update all profiles" ON public."Profiles";

-- Policy: Users can view their own profile
-- Users can SELECT their own profile where id matches their auth.uid()
CREATE POLICY "Users can view their own profile"
ON public."Profiles"
FOR SELECT
USING (
    id = auth.uid()::text
);

-- Policy: Users can update their own profile
-- Users can UPDATE their own profile where id matches their auth.uid()
CREATE POLICY "Users can update their own profile"
ON public."Profiles"
FOR UPDATE
USING (
    id = auth.uid()::text
)
WITH CHECK (
    id = auth.uid()::text
);

-- Helper function to check if user is admin (reuse if exists, or create)
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

-- Policy: Admins can view all profiles
-- Admins can SELECT all profiles regardless of id
CREATE POLICY "Admins can view all profiles"
ON public."Profiles"
FOR SELECT
USING (
    public.is_admin()
);

-- Policy: Admins can update all profiles
-- Admins can UPDATE any profile regardless of id
CREATE POLICY "Admins can update all profiles"
ON public."Profiles"
FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- Grant necessary permissions
-- Ensure authenticated users can use the table
GRANT SELECT, INSERT, UPDATE ON public."Profiles" TO authenticated;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

