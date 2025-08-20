export interface Car {
  id: string;
  name: string;
  category: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury';
  image: string;
  pricePerDay: number;
  seats: number;
  transmission: 'automatic' | 'manual';
  fuelType: 'gasoline' | 'hybrid' | 'electric';
  features: string[];
  rating: number;
  reviews: number;
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
  avatar: string;
  rating: number;
  comment: string;
  location: string;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}