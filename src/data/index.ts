export const hiddenPaths = ['/dashboard', '/admin', '/settings', '/orders', '/users'];

export const sparkData = Array.from({ length: 12 }).map((_, i) => ({
    x: i,
    y: Math.round(40 + Math.sin(i / 2) * 8 + i + Math.random() * 5), // random variation ±5
}));

export const mainChart = Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    sales: Math.round(2000 + Math.sin(i / 4) * 200 + i * 12 + Math.random() * 150), // random ±150
    baseline: Math.round(1200 + Math.cos(i / 5) * 80 + i * 4 + Math.random() * 50), // random ±50
}));


export const orders = [
    {
        id: '8',
        date: 'Oct 31, 2025',
        status: 'Paid',
        amount: '120.00',
        customer: 'Customer 1',
        avatar: 'https://via.placeholder.com/40?text=Car1',
        carId: '1',
    },
    {
        id: '7',
        date: 'Oct 30, 2025',
        status: 'Pending',
        amount: '240.00',
        customer: 'Customer 2',
        avatar: 'https://via.placeholder.com/40?text=Car2',
        carId: '2',
    },
    {
        id: '6',
        date: 'Oct 29, 2025',
        status: 'Refunded',
        amount: '360.00',
        customer: 'Customer 3',
        avatar: 'https://via.placeholder.com/40?text=Car3',
        carId: '3',
    },
    {
        id: '5',
        date: 'Oct 28, 2025',
        status: 'Paid',
        amount: '120.00',
        customer: 'Customer 4',
        avatar: 'https://via.placeholder.com/40?text=Car4',
        carId: '2',
    },
    {
        id: '4',
        date: 'Oct 27, 2025',
        status: 'Pending',
        amount: '240.00',
        customer: 'Customer 5',
        avatar: 'https://via.placeholder.com/40?text=Car5',
        carId: '1',
    },
    {
        id: '3',
        date: 'Oct 26, 2025',
        status: 'Refunded',
        amount: '360.00',
        customer: 'Customer 6',
        avatar: 'https://via.placeholder.com/40?text=Car6',
        carId: '2',
    },
    {
        id: '2',
        date: 'Oct 25, 2025',
        status: 'Paid',
        amount: '120.00',
        customer: 'Customer 7',
        avatar: 'https://via.placeholder.com/40?text=Car7',
        carId: '3',
    },
    {
        id: '1',
        date: 'Oct 24, 2025',
        status: 'Pending',
        amount: '240.00',
        customer: 'Customer 8',
        avatar: 'https://via.placeholder.com/40?text=Car8',
        carId: '4',
    },
];
