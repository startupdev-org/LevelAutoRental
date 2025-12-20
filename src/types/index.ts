import { OptionsState } from "../constants/rentalOptions";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price_per_day?: number; // Default price per day (can be overridden by rental-specific price)
  price_2_4_days: number; // Price per day for 2-4 days rentals
  price_5_15_days: number; // Price per day for 5-15 days rentals
  price_16_30_days: number; // Price per day for 16-30 days rentals
  price_over_30_days: number; // Price per day for over 30 days rentals
  discount_percentage?: number; // optional discount percentage (0-100)
  category?: 'suv' | 'sports' | 'luxury' | ('suv' | 'sports' | 'luxury')[]; // optional if nullable in DB, supports single or multiple categories
  image_url?: string | null;
  photo_gallery?: string[] | null;
  seats?: number;
  transmission?: 'Automatic' | 'Manual';
  body?: 'Coupe' | 'Sedan' | 'SUV';
  fuel_type?: 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol';
  features?: string[];
  rating?: number;
  reviews?: number;
  status?: string; // optional
  mileage?: number;
  fuel_consumption?: number;
  drivetrain?: string; // FWD, RWD, AWD
  time?: string;
  power?: string; // e.g., "300 HP"
  acceleration?: string; // e.g., "5.2s"
  description?: string;
  long_description?: string;
}


export interface BookingForm {
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  returnDate: string;
  category: string;
}

export interface Testimonial {
  id: string;
  name: string;
  userName: string;
  rating: number;
  comment: string;
  location: string;
  product: {
    name: string;
    images: { url: string }[];
  };
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface User {
  id: string;

  // profile fields
  avatar?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string | null;

  // auth field
  email?: string | null;
}


export interface Orders {
  id: number,
  carId: string,
  userId: string,
  avatar: string,
  pickupDate: string,
  returnDate: string,
  pickupTime: string,
  returnTime: string,

  total_amount: string,

  status: string
}

export interface CarFilterOptions {
  searchQuery?: string;
  sortBy: 'price' | 'year' | 'status' | null;
  sortOrder: 'asc' | 'desc';
  status: 'available' | 'borrowed' | null;
  page?: number;
  pageSize?: number;
}

export interface FavoriteCar {
  car: Car | null;
  lastRental: string | null;
  borrowCount: number | null;
}

export interface BorrowRequest {
  id?: string;
  car_id: string;
  user_id: string | null;
  start_date: Date | string;
  start_time: string;
  end_date: Date | string;
  end_time: string;
  price_per_day: number;
  customer_name: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_age?: number;
  total_amount: number;
  options: OptionsState;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  requested_at: string;
  updated_at: string;
  comment?: string;
}

export interface BorrowRequestDTO {
  id: string;
  car_id: string;
  user_id?: string | null;

  start_date: Date | string;
  start_time: string;
  end_date: Date | string;
  end_time: string;

  price_per_day: string;
  customer_name: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone?: string;

  total_amount: number;

  // must match original
  comment?: string;

  options: OptionsState;

  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  requested_at: string;
  updated_at: string;
  contract_url?: string;

  car: Car;
}


export interface Rental {
  id?: string;
  request_id: string;

  user_id?: string;
  customer_email: string;

  car_id: string;
  price_per_day: string | number;

  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  rental_status: string;
  total_amount?: number;
  subtotal?: number;
  taxes_fees?: number;
  additional_taxes?: number;
  created_at: string;
  updated_at?: string;
  contract_url?: string;
  options?: any; // JSON object for additional service options
}

export interface RentalDTO {
  id: string;
  request_id: string;

  user_id?: string;
  customer_email: string;

  car?: Car;
  car_id: string;
  price_per_day: string | number;

  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  rental_status: string;
  total_amount?: number;
  subtotal?: number;
  taxes_fees?: number;
  additional_taxes?: number;
  created_at: string;
  updated_at?: string;
  contract_url?: string;
  options?: any; // JSON object for additional service options
}

export interface OrderDisplay {
  id: number | string,
  carId: string,
  userId: string,
  avatar: string,
  pickupDate: string,
  returnDate: string,
  pickupTime: string,
  returnTime: string,
  total_amount: string,
  status: string,
  customerName?: string,
  customerEmail?: string,
  customerPhone?: string,
  customerFirstName?: string,
  customerLastName?: string,
  customerAge?: string | number,
  carName?: string,
  createdAt?: string,
  type?: 'request' | 'rental',
  amount?: number,
  contract_url?: string,
  options?: any, // Service options (unlimitedKm, priorityService, etc.) stored as JSON
  request_id?: string | number,
  price_per_day?: number,
}