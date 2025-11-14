import { User, Orders } from '../types/index'


export const hiddenPaths = ['/admin', '/dashboard'];

export const sparkData = Array.from({ length: 12 }).map((_, i) => ({
    x: i,
    y: Math.round(40 + Math.sin(i / 2) * 8 + i + Math.random() * 5), // random variation ±5
}));

export const mainChart = Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    sales: Math.round(2000 + Math.sin(i / 4) * 200 + i * 12 + Math.random() * 150), // random ±150
    baseline: Math.round(1200 + Math.cos(i / 5) * 80 + i * 4 + Math.random() * 50), // random ±50
}));


export const orders: Orders[] = [
    {
        id: 1,
        carId: '2',
        userId: '2',
        avatar: 'https://via.placeholder.com/40?text=Car8',
        pickupDate: 'Nov 08, 2025',
        pickupTime: '08:30 AM',
        returnDate: 'Nov 12, 2025',
        returnTime: '02:30 PM',
        total_amount: '240.00',
        status: 'Pending'
    },
    {
        id: 2,
        carId: '1',
        userId: '4',
        avatar: 'https://via.placeholder.com/40?text=Car7',
        pickupDate: 'Nov 07, 2025',
        pickupTime: '11:30 AM',
        returnDate: 'Nov 11, 2025',
        returnTime: '05:30 PM',
        total_amount: '120.00',
        status: 'Paid'
    },
    {
        id: 3,
        carId: '0',
        userId: '1',
        avatar: 'https://via.placeholder.com/40?text=Car6',
        pickupDate: 'Nov 06, 2025',
        pickupTime: '09:00 AM',
        returnDate: 'Nov 10, 2025',
        returnTime: '03:00 PM',
        total_amount: '360.00',
        status: 'Refunded'
    },
    {
        id: 4,
        carId: '4',
        userId: '1',
        avatar: 'https://via.placeholder.com/40?text=Car5',
        pickupDate: 'Nov 05, 2025',
        pickupTime: '10:30 AM',
        returnDate: 'Nov 09, 2025',
        returnTime: '04:30 PM',
        total_amount: '240.00',
        status: 'Pending'
    },
    {
        id: 5,
        carId: '3',
        userId: '5',
        avatar: 'https://via.placeholder.com/40?text=Car4',
        pickupDate: 'Nov 04, 2025',
        pickupTime: '08:00 AM',
        returnDate: 'Nov 08, 2025',
        returnTime: '02:00 PM',
        total_amount: '120.00',
        status: 'Paid'
    },
    {
        id: 6,
        carId: '2',
        userId: '3',
        avatar: '/cars/c43/c43-2.jpg',
        pickupDate: 'Nov 03, 2025',
        pickupTime: '11:00 AM',
        returnDate: 'Nov 07, 2025',
        returnTime: '05:00 PM',
        total_amount: '360.00',
        status: 'Refunded',
    },
    {
        id: 7,
        carId: '1',
        userId: '2',
        avatar: '/cars/c43/c43-2.jpg',
        pickupDate: 'Nov 02, 2025',
        pickupTime: '09:30 AM',
        returnDate: 'Nov 06, 2025',
        returnTime: '03:30 PM',
        total_amount: '240.00',
        status: 'Pending'
    },
    {
        id: 9,
        carId: '3',
        userId: '2',
        avatar: '/LevelAutoRental/cars/c43/c43-1.jpg',
        pickupDate: 'Nov 10, 2025',
        pickupTime: '10:00 AM',
        returnDate: 'Nov 14, 2025',
        returnTime: '02:00 PM',
        total_amount: '180.00',
        status: 'active'
    },
    {
        id: 10,
        carId: '4',
        userId: '3',
        avatar: 'https://via.placeholder.com/40?text=Car10',
        pickupDate: 'Nov 11, 2025',
        pickupTime: '09:00 AM',
        returnDate: 'Nov 15, 2025',
        returnTime: '03:00 PM',
        total_amount: '200.00',
        status: 'Pending'
    },
    {
        id: 11,
        carId: '5',
        userId: '1',
        avatar: 'https://via.placeholder.com/40?text=Car11',
        pickupDate: 'Nov 12, 2025',
        pickupTime: '08:30 AM',
        returnDate: 'Nov 16, 2025',
        returnTime: '12:30 PM',
        total_amount: '150.00',
        status: 'Paid'
    },
    {
        id: 12,
        carId: '2',
        userId: '4',
        avatar: 'https://via.placeholder.com/40?text=Car12',
        pickupDate: 'Nov 13, 2025',
        pickupTime: '11:00 AM',
        returnDate: 'Nov 17, 2025',
        returnTime: '03:00 PM',
        total_amount: '300.00',
        status: 'Refunded'
    },
    {
        id: 13,
        carId: '1',
        userId: '5',
        avatar: '/LevelAutoRental/cars/c43/c43-1.jpg',
        pickupDate: 'Nov 14, 2025',
        pickupTime: '09:30 AM',
        returnDate: 'Nov 18, 2025',
        returnTime: '01:30 PM',
        total_amount: '220.00',
        status: 'active'
    }
];

export const users: User[] = [
    {
        id: 1,
        firstName: "Victorin",
        lastName: "Levitchi",
        phone: "+373 123 456 789",
        email: "victorin@example.com",
        role: "Admin",
    },
    {
        id: 2,
        firstName: "Jane",
        lastName: "Doe",
        phone: "+373 234 567 890",
        email: "jane@example.com",
        role: "User",
    },
    {
        id: 3,
        firstName: "John",
        lastName: "Smith",
        phone: "+373 345 678 901",
        email: "john.smith@example.com",
        role: "User",
    },
    {
        id: 4,
        firstName: "Alice",
        lastName: "Johnson",
        phone: "+373 456 789 012",
        email: "alice.johnson@example.com",
        role: "User",
    },
    {
        id: 5,
        firstName: "Bob",
        lastName: "Brown",
        phone: "+373 567 890 123",
        email: "bob.brown@example.com",
        role: "User",
    },
    {
        id: 6,
        firstName: "Emma",
        lastName: "Wilson",
        phone: "+373 678 901 234",
        email: "emma.wilson@example.com",
        role: "User",
    },
    {
        id: 7,
        firstName: "Michael",
        lastName: "Davis",
        phone: "+373 789 012 345",
        email: "michael.davis@example.com",
        role: "User",
    },
    {
        id: 8,
        firstName: "Sophia",
        lastName: "Taylor",
        phone: "+373 890 123 456",
        email: "sophia.taylor@example.com",
        role: "User",
    },
    {
        id: 9,
        firstName: "Daniel",
        lastName: "Anderson",
        phone: "+373 901 234 567",
        email: "daniel.anderson@example.com",
        role: "User",
    },
    {
        id: 10,
        firstName: "Olivia",
        lastName: "Thomas",
        phone: "+373 012 345 678",
        email: "olivia.thomas@example.com",
        role: "User",
    }
];
