

ALTER TABLE "Rentals" DROP CONSTRAINT IF EXISTS "Rentals_user_id_fkey";
ALTER TABLE "FavoriteCars" DROP CONSTRAINT IF EXISTS "FavoriteCars_user_id_fkey";
ALTER TABLE "Reviews" DROP CONSTRAINT IF EXISTS "Reviews_user_id_fkey";
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

ALTER TABLE "BorrowRequest"
ADD CONSTRAINT borrow_request_profiles_fk FOREIGN KEY (customer_email) REFERENCES "Profiles"(email)


