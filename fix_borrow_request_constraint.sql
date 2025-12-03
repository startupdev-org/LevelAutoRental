-- Fix the foreign key constraint issue by dropping the problematic constraint
-- This allows guest users to create borrow requests without requiring them to have profiles

-- Drop the problematic foreign key constraint
ALTER TABLE "BorrowRequest" DROP CONSTRAINT IF EXISTS "borrow_request_profiles_fk";

-- Optional: Add a comment to the table explaining the design decision
COMMENT ON TABLE "BorrowRequest" IS 'Borrow requests can be created by both registered users and guests. Guest users use email-based identification without requiring a profile record.';
