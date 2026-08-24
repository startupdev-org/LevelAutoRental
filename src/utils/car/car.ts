import { Car } from "../../types";

export const getCarName = (car: Car | null | undefined): string => {
    if (!car) return '';
    return `${car.make} ${car.model}`;
};

export const getBorrowRequestsStatusDisplay = (status: string): { text: string; className: string } => {
    const statusUpper = status.toUpperCase();

    if (statusUpper === 'PENDING') {
        return {
            text: 'Pending',
            className: 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
        };
    } else if (statusUpper === 'PROCESSED') {
        return {
            text: 'Processed',
            className: 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
        };
    } else if (statusUpper === 'APPROVED') {
        return {
            text: 'Approved',
            className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
        };
    } else if (statusUpper === 'CANCELLED') {
        return {
            text: 'Cancelled',
            className: 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
        };
    }

    // Default fallback
    return {
        text: statusUpper,
        className: 'bg-gray-300/20 text-gray-700 border border-gray-300/50'
    };
};

export const getRentalStatusDisplay = (status: string): { text: string; className: string } => {
    const statusUpper = status.toUpperCase();

    if (statusUpper === 'ACTIVE') {
        return {
            text: 'Active',
            className: 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
        };
    } else if (statusUpper === 'COMPLETED') {
        return {
            text: 'Completed',
            className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
        };
    } else if (statusUpper === 'CANCELLED') {
        return {
            text: 'Cancelled',
            className: 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
        };
    }

    // Default fallback
    return {
        text: statusUpper,
        className: 'bg-gray-300/20 text-gray-700 border border-gray-300/50'
    };
};

export const MAKE_LOGOS: { src: string; alt: string; filter: string }[] = [
    { src: '/logos/audi.png', alt: 'Audi', filter: 'Audi' },
    { src: '/logos/bmw.webp', alt: 'BMW', filter: 'BMW' },
    { src: '/logos/hyundai.png', alt: 'Hyundai', filter: 'Hyundai' },
    { src: '/logos/maserati.png', alt: 'Maserati', filter: 'Maserati' },
    { src: '/logos/merc.svg', alt: 'Mercedes-Benz', filter: 'Mercedes' },
    { src: '/logos/lincoln.png', alt: 'Lincoln', filter: 'Lincoln' },
    { src: '/logos/volkswagen-1-logo-black-and-white.png', alt: 'Volkswagen', filter: 'Volkswagen' },
    { src: '/logos/porsche.png', alt: 'Porsche', filter: 'Porsche' },
    { src: '/logos/renault.png', alt: 'Renault', filter: 'Renault' },
];

export const getMakeLogo = (make: string): string | null => {
    const makeLower = make.toLowerCase().trim();
    const logoMap: { [key: string]: string } = {
        'mercedes': '/logos/merc.svg',
        'mercedes-benz': '/logos/merc.svg',
        'bmw': '/logos/bmw.webp',
        'audi': '/logos/audi.png',
        'hyundai': '/logos/hyundai.png',
        'maserati': '/logos/maserati.png',
        'volkswagen': '/logos/volkswagen-1-logo-black-and-white.png',
        'vw': '/logos/volkswagen-1-logo-black-and-white.png',
        'lincoln': '/logos/lincoln.png',
        'porsche': '/logos/porsche.png',
        'renault': '/logos/renault.png',
    };
    if (logoMap[makeLower]) return logoMap[makeLower];
    const match = Object.keys(logoMap).find((key) => key.length > 2 && makeLower.startsWith(key));
    return match ? logoMap[match] : null;
};