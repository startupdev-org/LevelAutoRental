import { Car } from '../types';

export const cars: Car[] = [
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
        body: 'SUV',
        transmission: 'Automatic',
        fuelType: 'diesel',
        drivetrain: 'AWD',
        features: ['Motor 3.0 Diesel', 'Interior Luxos Premium', 'Confort Exclusiv'],
        rating: 4.9,
        reviews: 187
    },
    {
        id: 6,
        name: 'Mercedes CLS',
        category: 'luxury',
        image: '/LevelAutoRental/cars/cls350/cls-1.jpg',
        photoGallery: [
            '/LevelAutoRental/cars/cls350/cls-1.jpg',
            '/LevelAutoRental/cars/cls350/cls-2.jpg',
            '/LevelAutoRental/cars/cls350/cls-3.jpg',
            '/LevelAutoRental/cars/cls350/cls-4.jpg',
            '/LevelAutoRental/cars/cls350/cls-5.jpg',
            '/LevelAutoRental/cars/cls350/cls-6.jpg'
        ],
        pricePerDay: 400,
        year: 2023,
        seats: 5,
        body: 'Sedan',
        transmission: 'Automatic',
        fuelType: 'diesel',
        drivetrain: 'AWD',
        features: ['Motor Diesel 3.0L', 'Interior Luxos Premium', 'Tehnologie Modernă', 'Design Sportiv și Elegant', '4MATIC AWD'],
        rating: 4.9,
        reviews: 162,
        availability: 'Liber de 12 septembrie, 09:00'
    },
];