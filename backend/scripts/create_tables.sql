-- ENUM types
CREATE TYPE "ROLES" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MAIB', 'MICB', 'PAYPAL');

-- Cars table
CREATE TABLE IF NOT EXISTS "Cars" (
    "id" SERIAL PRIMARY KEY,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "year" SMALLINT CHECK(year > 0),
    "price_per_day" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50),
    "body" VARCHAR(50),
    "transmission" VARCHAR(40),
    "drivetrain" VARCHAR(50),
    "seats" SMALLINT,
    "color" VARCHAR(50),
    "kilometers" BIGINT,
    "license" VARCHAR(10),
    "features" TEXT[],
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS "Users" (
    "id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50),
    "role" VARCHAR(50)
);

-- Rentals table
CREATE TABLE IF NOT EXISTS "Rentals" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "price_per_day" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2),
    "taxes_fees" DECIMAL(10,2),
    "additional_taxes" DECIMAL(10,2),
    "total_amount" DECIMAL(10,2),
    "payment_status" VARCHAR(50),
    "payment_method" VARCHAR(50),
    "rental_status" VARCHAR(50),
    "notes" VARCHAR(255),
    "special_requests" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "features" TEXT[],
    FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("car_id") REFERENCES "Cars"("id") ON DELETE CASCADE
);

-- FavoriteCars table
CREATE TABLE IF NOT EXISTS "FavoriteCars" (
    "id" SERIAL PRIMARY KEY,
    "car_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    FOREIGN KEY ("car_id") REFERENCES "Cars"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS "Reviews" (
    "id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "time" DATE,
    "stars" SMALLINT CHECK(stars >= 0 AND stars <= 5),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- BorrowRequest table (corrected typo)
CREATE TABLE IF NOT EXISTS "BorrowRequest" (
    "id" SERIAL PRIMARY KEY,
    "car_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "requested_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("car_id") REFERENCES "Cars"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Optional Features table (if you want to keep features normalized)
CREATE TABLE IF NOT EXISTS "Features" (
    "id" SERIAL PRIMARY KEY,
    "car_id" INTEGER NOT NULL,
    "feature" VARCHAR(255) NOT NULL,
    FOREIGN KEY ("car_id") REFERENCES "Cars"("id") ON DELETE CASCADE
);
