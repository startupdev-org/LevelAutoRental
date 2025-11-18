export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  discount_percentage?: number; // optional discount percentage (0-100)
  category?: 'suv' | 'sports' | 'luxury'; // optional if nullable in DB
  image_url?: string;
  photo_gallery?: string[]; // optional array of URLs
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
  drivetrain?: string; // FWD, RWD, 4WD, AWD
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
  avatar: string;
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