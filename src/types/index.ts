export interface Car {
  id: number;
  year: number;
  name: string;
  category: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury';
  image: string;
  photoGallery?: string[]; // Optional array of photo URLs for gallery
  pricePerDay: number;
  seats: number;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol';
  features: string[];
  rating: number;
  reviews: number;
  availability?: string; // Optional property to show when car is free for rent
  mileage?: number; // Mileage in kilometers
  fuelConsumption?: number; // Fuel consumption (L/100km)
  drivetrain?: string; // Drivetrain type (FWD, RWD, 4WD, AWD)
  time?: string; // Time specification
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