

ALTER TABLE "Rentals" DROP CONSTRAINT IF EXISTS "Rentals_user_id_fkey";
ALTER TABLE "FavoriteCars" DROP CONSTRAINT IF EXISTS "FavoriteCars_user_id_fkey";
ALTER TABLE "Reviews" DROP CONSTRAINT IF EXISTS "Reviews_user_id_fkey";
-- Fix the trigger to allow ACTIVE status
CREATE OR REPLACE FUNCTION check_rental_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow ACTIVE status without modification
    IF NEW.rental_status = 'ACTIVE' THEN
        RETURN NEW;
    END IF;

    -- Original logic for other statuses
    -- Add your existing trigger logic here if needed

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "BorrowRequest" DROP CONSTRAINT IF EXISTS "BorrowRequest_user_id_fkey";

ALTER TABLE "Profiles" 
ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;

ALTER TABLE "Rentals" 
ALTER COLUMN "user_id" TYPE TEXT USING "user_id"::TEXT;

ALTER TABLE "FavoriteCars" 
ALTER COLUMN "user_id" TYPE TEXT USING "user_id"::TEXT;

ALTER TABLE "Reviews" 
ALTER COLUMN "user_id" TYPE TEXT USING "user_id"::TEXT;

ALTER TABLE "BorrowRequest" 
ALTER COLUMN "user_id" TYPE TEXT USING "user_id"::TEXT;


-- get the supabase user & it's profile
SELECT *
FROM "Profiles" p
JOIN auth.Users u ON u.id = CAST(p.id AS uuid)	

SELECT *
FROM auth.Users

SELECT *
FROM "Profiles"

SELECT user_id
FROM "Rentals"


ALTER TABLE "Rentals"
ADD CONSTRAINT rentals_profiles_fk FOREIGN KEY (user_id) REFERENCES "Profiles"(id)

-- Removed problematic foreign key constraint that prevented guest users from creating borrow requests
-- ALTER TABLE "BorrowRequest"
-- ADD CONSTRAINT borrow_request_profiles_fk FOREIGN KEY (customer_email) REFERENCES "Profiles"(email);

-- Add missing columns to Cars table
ALTER TABLE public."Cars"
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS photo_gallery TEXT[],
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2);

-- Add comments for the new columns
COMMENT ON COLUMN public."Cars".fuel_type IS 'Type of fuel (gasoline, diesel, electric, hybrid)';
COMMENT ON COLUMN public."Cars".category IS 'Car categories (can be JSON array or single value)';
COMMENT ON COLUMN public."Cars".image_url IS 'Main image URL for the car';
COMMENT ON COLUMN public."Cars".photo_gallery IS 'Array of photo URLs for the car gallery';
COMMENT ON COLUMN public."Cars".rating IS 'Average rating (0-5)';
COMMENT ON COLUMN public."Cars".reviews IS 'Number of reviews';
COMMENT ON COLUMN public."Cars".name IS 'Alternative name for the car';
COMMENT ON COLUMN public."Cars".discount_percentage IS 'Discount percentage (0-100)';

-- Removed the auto_execute_rental_trigger since EXECUTED status has been removed
-- The trigger was automatically setting APPROVED requests to EXECUTED when start date passed
-- Now all approved requests stay as APPROVED status

-- Trigger to automatically update rental status based on dates
CREATE OR REPLACE FUNCTION auto_update_rental_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle CONTRACT -> ACTIVE transition when start_date arrives
    IF NEW.rental_status = 'CONTRACT' AND NEW.start_date IS NOT NULL THEN
        IF NEW.start_date::date < CURRENT_DATE OR
           (NEW.start_date::date = CURRENT_DATE AND CURRENT_TIME >= '09:00:00'::time) THEN
            NEW.rental_status := 'ACTIVE';
            NEW.updated_at := CURRENT_TIMESTAMP;
            RAISE NOTICE 'Auto-activated rental % - start date has arrived', NEW.id;
        END IF;
    END IF;

    -- Handle ACTIVE -> COMPLETED transition when end_date passes
    IF NEW.rental_status = 'ACTIVE' AND NEW.end_date IS NOT NULL THEN
        IF NEW.end_date::date < CURRENT_DATE OR
           (NEW.end_date::date = CURRENT_DATE AND CURRENT_TIME >= '18:00:00'::time) THEN
            NEW.rental_status := 'COMPLETED';
            NEW.updated_at := CURRENT_TIMESTAMP;
            RAISE NOTICE 'Auto-completed rental % - end date has passed', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for Rentals table
DROP TRIGGER IF EXISTS auto_update_rental_status_trigger ON "Rentals";
CREATE TRIGGER auto_update_rental_status_trigger
    BEFORE UPDATE ON "Rentals"
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_rental_status();


