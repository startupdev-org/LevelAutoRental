-- Enable Row Level Security on BorrowRequest table
ALTER TABLE public."BorrowRequest" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Users can create their own borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Users can update their own pending borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Users can delete their own pending borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Admins can view all borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Admins can create borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Admins can update all borrow requests" ON public."BorrowRequest";
DROP POLICY IF EXISTS "Admins can delete all borrow requests" ON public."BorrowRequest";

-- Policy: Users can view their own borrow requests
-- Users can only SELECT requests where user_id matches their auth.uid()
CREATE POLICY "Users can view their own borrow requests"
ON public."BorrowRequest"
FOR SELECT
USING (
    user_id = auth.uid()::text
);

-- Policy: Users can create their own borrow requests
-- Users can INSERT requests where user_id matches their auth.uid()
CREATE POLICY "Users can create their own borrow requests"
ON public."BorrowRequest"
FOR INSERT
WITH CHECK (
    user_id = auth.uid()::text
);

-- Policy: Users can update their own pending borrow requests
-- Users can UPDATE their own requests, but only if status is PENDING (allows cancellation)
CREATE POLICY "Users can update their own pending borrow requests"
ON public."BorrowRequest"
FOR UPDATE
USING (
    user_id = auth.uid()::text
    AND status = 'PENDING'
)
WITH CHECK (
    user_id = auth.uid()::text
);

-- Policy: Users can delete their own pending borrow requests
-- Users can DELETE their own requests, but only if status is PENDING
CREATE POLICY "Users can delete their own pending borrow requests"
ON public."BorrowRequest"
FOR DELETE
USING (
    user_id = auth.uid()::text
    AND status = 'PENDING'
);

-- Helper function to check if user is admin
-- This function checks if the current user's role in Profiles table is 'ADMIN'
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

-- Policy: Admins can view all borrow requests
-- Admins can SELECT all requests regardless of user_id
CREATE POLICY "Admins can view all borrow requests"
ON public."BorrowRequest"
FOR SELECT
USING (
    public.is_admin()
);

-- Policy: Admins can create borrow requests
-- Admins can INSERT requests with any user_id (for admin-created requests)
CREATE POLICY "Admins can create borrow requests"
ON public."BorrowRequest"
FOR INSERT
WITH CHECK (
    public.is_admin()
);

-- Policy: Admins can update all borrow requests
-- Admins can UPDATE any request regardless of user_id or status
CREATE POLICY "Admins can update all borrow requests"
ON public."BorrowRequest"
FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- Policy: Admins can delete all borrow requests
-- Admins can DELETE any request regardless of user_id or status
CREATE POLICY "Admins can delete all borrow requests"
ON public."BorrowRequest"
FOR DELETE
USING (
    public.is_admin()
);

-- Grant necessary permissions
-- Ensure authenticated users can use the table
GRANT SELECT, INSERT, UPDATE, DELETE ON public."BorrowRequest" TO authenticated;
GRANT USAGE ON SEQUENCE public."BorrowRequest_id_seq" TO authenticated;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

