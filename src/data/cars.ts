import { Car } from '../types';

export const cars: Car[] = [
  {
    id: 1,
    name: 'Mercedes-AMG C43',
    category: 'luxury',
    image: '/LevelAutoRental/cars/c43/c43-1.jpg',
    photoGallery: [
      '/LevelAutoRental/cars/c43/c43-1.jpg',
      '/LevelAutoRental/cars/c43/c43-2.jpg',
      '/LevelAutoRental/cars/c43/c43-3.jpg',
      '/LevelAutoRental/cars/c43/c43-4.jpg',
      '/LevelAutoRental/cars/c43/c43-5.jpg'
    ],
    pricePerDay: 280,
    year: 2018,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'gasoline',
    features: ['V6 BiTurbo 3.0L', '4MATIC AWD', 'Sport-Lux Interior'],
    rating: 4.9,
    reviews: 156
  },
  {
    id: 2,
    name: 'Mercedes GLE',
    category: 'luxury',
    image: '/LevelAutoRental/cars/gle/gle-1.jpg',
    photoGallery: [
      '/LevelAutoRental/cars/gle/gle-1.jpg',
      '/LevelAutoRental/cars/gle/gle-2.jpg',
      '/LevelAutoRental/cars/gle/gle-3.jpg',
      '/LevelAutoRental/cars/gle/gle-4.jpg',
      '/LevelAutoRental/cars/gle/gle-5.jpg'
    ],
    pricePerDay: 420,
    year: 2021,
    seats: 7,
    transmission: 'Automatic',
    fuelType: 'gasoline',
    features: ['Motor Benzină 2.0L', 'Interior Premium', 'Design Imponător'],
    rating: 4.8,
    reviews: 134
  },
  {
    id: 3,
    name: 'Mercedes CLS',
    category: 'luxury',
    image: '/LevelAutoRental/cars/cls/cls-1.jpg',
    photoGallery: [
      '/LevelAutoRental/cars/cls/cls-1.jpg',
      '/LevelAutoRental/cars/cls/cls-2.jpg',
      '/LevelAutoRental/cars/cls/cls-3.jpg',
      '/LevelAutoRental/cars/cls/cls-4.jpg',
      '/LevelAutoRental/cars/cls/cls-6.jpg'
    ],
    pricePerDay: 380,
    year: 2022,
    seats: 4,
    transmission: 'Automatic',
    fuelType: 'diesel',
    features: ['Motor 3.0 Diesel', 'Interior Luxos Premium', 'Confort Exclusiv'],
    rating: 4.9,
    reviews: 187
  },
  {
    id: 4,
    name: 'Maserati Ghibli',
    category: 'luxury',
    image: '/LevelAutoRental/cars/maserati/maserati-1.jpg',
    photoGallery: [
      '/LevelAutoRental/cars/maserati/maserati-1.jpg',
      '/LevelAutoRental/cars/maserati/maserati-2.jpg',
      '/LevelAutoRental/cars/maserati/maserati-3.jpg',
      '/LevelAutoRental/cars/maserati/maserati-4.jpg',
      '/LevelAutoRental/cars/maserati/maserati-5.jpg'
    ],
    pricePerDay: 520,
    year: 2017,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'gasoline',
    features: ['Motor V6 3.0', 'Interior Premium Piele', 'Ocazii Speciale'],
    rating: 4.9,
    reviews: 203
  }
];