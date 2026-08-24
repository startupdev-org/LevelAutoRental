-- Schema ONLY. Run before seed_profiles_cars_borrow_rentals_inserts.sql
-- OR skip this and run install_profiles_cars_borrow_rentals_all.sql instead.
-- No triggers (add from old project after data load if needed).

create table public."Profiles" (
  id text not null,
  first_name character varying(50) not null,
  last_name character varying(50) not null,
  email character varying(255) not null,
  phone_number character varying(50) null,
  role character varying(50) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email)
);

create index if not exists idx_profiles_search on public."Profiles" using gin (
  to_tsvector(
    'english'::regconfig,
    (
      (
        (
          (coalesce(first_name, ''::character varying))::text || ' '::text
        ) || (coalesce(last_name, ''::character varying))::text
      ) || ' '::text
    ) || (coalesce(email, ''::character varying))::text
  )
);

create index if not exists idx_profiles_role on public."Profiles" using btree (role);
create index if not exists idx_profiles_email on public."Profiles" using btree (email);
create index if not exists idx_profiles_name on public."Profiles" using btree (first_name, last_name);
create index if not exists idx_profiles_created_at on public."Profiles" using btree (created_at desc);

create table public."Cars" (
  id serial not null,
  make character varying(50) not null,
  model character varying(255) not null,
  year smallint null,
  status character varying(50) null,
  body character varying(50) null,
  transmission character varying(40) null,
  drivetrain character varying(50) null,
  seats smallint null,
  features text[] null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  name character varying(255) null,
  category character varying(50) null,
  image_url text null,
  photo_gallery text[] null default array[]::text[],
  fuel_type character varying(50) null,
  rating numeric(3, 2) null default 0,
  reviews integer null default 0,
  pickup_date timestamp without time zone null,
  return_date timestamp without time zone null,
  price_2_4_days numeric(10, 2) null default 0,
  price_5_15_days numeric(10, 2) null default 0,
  price_16_30_days numeric(10, 2) null default 0,
  price_over_30_days numeric(10, 2) null default 0,
  discount numeric(5, 2) null default 0,
  constraint Cars_pkey primary key (id),
  constraint Cars_rating_check check ((rating >= (0)::numeric) and (rating <= (5)::numeric)),
  constraint Cars_reviews_check check ((reviews >= 0)),
  constraint Cars_year_check check ((year > 0)),
  constraint cars_discount_check check ((discount >= (0)::numeric) and (discount <= (100)::numeric))
);

create index if not exists idx_cars_category on public."Cars" using btree (category);
create index if not exists idx_cars_status on public."Cars" using btree (status);
create index if not exists idx_cars_make_model on public."Cars" using btree (make, model);

create table public."BorrowRequest" (
  id serial not null,
  car_id integer not null,
  start_date date not null,
  start_time time without time zone null default '09:00:00'::time without time zone,
  end_date date not null,
  end_time time without time zone null default '17:00:00'::time without time zone,
  status character varying(50) null default 'PENDING'::character varying,
  customer_name character varying(255) null,
  customer_first_name character varying(100) null,
  customer_last_name character varying(100) null,
  customer_email character varying(255) null,
  customer_phone character varying(50) null,
  customer_age integer null,
  comment text null,
  options jsonb null default '{}'::jsonb,
  total_amount numeric(10, 2) null,
  requested_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  user_id text null,
  price_per_day numeric(10, 2) not null,
  reason character varying null,
  contract_url text null,
  constraint borrowrequest_pkey primary key (id),
  constraint BorrowRequest_user_id_fkey foreign key (user_id) references "Profiles" (id),
  constraint borrowrequest_car_id_fkey foreign key (car_id) references "Cars" (id) on delete cascade,
  constraint borrowrequest_customer_age_check check ((customer_age is null) or (customer_age > 0)),
  constraint borrowrequest_end_date_check check ((end_date >= start_date)),
  constraint borrowrequest_status_check check (
    (status)::text = any (
      array[
        ('PENDING'::character varying)::text,
        ('APPROVED'::character varying)::text,
        ('PROCESSED'::character varying)::text,
        ('REJECTED'::character varying)::text,
        ('CANCELLED'::character varying)::text
      ]
    )
  )
);

create index if not exists idx_borrow_request_car_id on public."BorrowRequest" using btree (car_id);
create index if not exists idx_borrow_request_status on public."BorrowRequest" using btree (status);
create index if not exists idx_borrow_request_requested_at on public."BorrowRequest" using btree (requested_at desc);
create index if not exists idx_borrow_request_start_date on public."BorrowRequest" using btree (start_date);
create index if not exists idx_borrow_request_end_date on public."BorrowRequest" using btree (end_date);

create table public."Rentals" (
  id serial not null,
  user_id text null,
  car_id integer not null,
  start_date date not null,
  end_date date not null,
  price_per_day numeric(10, 2) not null,
  subtotal numeric(10, 2) null,
  taxes_fees numeric(10, 2) null,
  additional_taxes numeric(10, 2) null,
  total_amount numeric(10, 2) null,
  payment_status text null default 'PENDING'::text,
  payment_method character varying(50) null,
  rental_status text null default 'ACTIVE'::text,
  notes character varying(255) null,
  special_requests character varying(255) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  options jsonb null,
  start_time character varying(10) null default '09:00'::character varying,
  end_time character varying(10) null default '17:00'::character varying,
  contract_url text null,
  request_id integer null,
  customer_email character varying(40) null,
  constraint Rentals_pkey primary key (id),
  constraint Rentals_request_id_fkey foreign key (request_id) references "BorrowRequest" (id) on delete set null,
  constraint Rentals_user_id_fkey foreign key (user_id) references "Profiles" (id),
  constraint Rentals_car_id_fkey foreign key (car_id) references "Cars" (id) on delete cascade,
  constraint rentals_total_amount_check check ((total_amount is null) or (total_amount >= (0)::numeric)),
  constraint rentals_dates_check check ((end_date >= start_date)),
  constraint rentals_price_per_day_check check ((price_per_day >= (0)::numeric)),
  constraint rentals_rental_status_check check (
    rental_status = any (
      array[
        ('ACTIVE'::character varying)::text,
        ('FINISHED'::character varying)::text,
        ('CANCELLED'::character varying)::text
      ]
    )
  )
);

create index if not exists idx_rentals_car_id on public."Rentals" using btree (car_id);
create index if not exists idx_rentals_created_at on public."Rentals" using btree (created_at desc);
create index if not exists idx_rentals_user_id on public."Rentals" using btree (user_id);
create index if not exists idx_rentals_contract_url on public."Rentals" using btree (contract_url) where (contract_url is not null);
create index if not exists idx_rentals_request_id on public."Rentals" using btree (request_id) where (request_id is not null);
create index if not exists idx_rentals_payment_status on public."Rentals" using btree (payment_status);
create index if not exists idx_rentals_status on public."Rentals" using btree (rental_status);
create index if not exists idx_rentals_dates on public."Rentals" using btree (start_date, end_date);
create index if not exists idx_rentals_active_dates on public."Rentals" using btree (start_date, end_date) where (rental_status = 'ACTIVE'::text);
