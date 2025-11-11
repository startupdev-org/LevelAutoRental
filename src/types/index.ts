export interface Car {
  id: number;
  year: number;
  name: string;
  category: 'suv' | 'sports' | 'luxury';
  image: string;
  photoGallery?: string[]; // Optional array of photo URLs for gallery
  pricePerDay: number;
  seats: number;
  transmission: 'Automatic' | 'Manual';
  body: 'Coupe' | 'Sedan' | 'SUV',
  fuelType: 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol';
  features: string[];
  rating: number;
  reviews: number;
  availability?: string; // Optional property to show when car is free for rent
  mileage?: number; // Mileage in kilometers
  fuelConsumption?: number; // Fuel consumption (L/100km)
  drivetrain?: string; // Drivetrain type (FWD, RWD, 4WD, AWD)
  time?: string; // Time specification
  power?: string; // Engine power (e.g., "300 HP")
  acceleration?: string; // 0-100 km/h acceleration (e.g., "5.2s")
  description?: string; // Short description
  longDescription?: string; // Detailed description
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
  id: number;
  avatar?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
};