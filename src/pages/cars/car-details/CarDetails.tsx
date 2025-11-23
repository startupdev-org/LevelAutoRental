import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
    Star,
    Calendar,
    ChevronRight,
    Phone,
    Send,
    Clock,
    X as XIcon,
    ChevronLeft,
    Maximize2,
    Users,
    Gauge,
    Fuel,
    Zap,
    Settings
} from 'lucide-react';
import { RiGasStationLine } from "react-icons/ri";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled } from "react-icons/tb";
import { LiaCarSideSolid } from 'react-icons/lia';
import { BiSolidHeart } from "react-icons/bi";
import { CarNotFound } from '../sections/CarNotFound';
import { RentalRequestModal } from '../../../components/modals/RentalRequestModal';
import { ContractSection } from '../sections/ContractSection';
import { Car } from '../../../types';
import { fetchCarById } from '../../../lib/cars';
import { fetchImagesByCarName } from '../../../lib/db/cars/cars';
import { fetchRentals } from '../../../lib/orders';
import { RentalOptionsSection } from '../sections/RentalOptionsSection';

export const CarDetails: React.FC = () => {
    const { carId } = useParams<{ carId: string }>();
    const navigate = useNavigate();

    // ───── STATE ─────
    const [car, setCar] = useState<Car | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | undefined>();
    const [isFavorite, setIsFavorite] = useState(false);

    const [pickupDate, setPickupDate] = useState<string>('');
    const [returnDate, setReturnDate] = useState<string>('');
    const [pickupTime, setPickupTime] = useState<string>('');
    const [returnTime, setReturnTime] = useState<string>('');

    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);

    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { pickup: today, return: tomorrow };
    });

    const [showRentalModal, setShowRentalModal] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);

    // ───── REFS ─────
    const pickupCalendarRef = useRef<HTMLDivElement>(null);
    const returnCalendarRef = useRef<HTMLDivElement>(null);
    const pickupTimeRef = useRef<HTMLDivElement>(null);
    const returnTimeRef = useRef<HTMLDivElement>(null);
    const imageSliderRef = useRef<Slider>(null);

    // ───── HELPERS ─────
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

    const saveFavorite = (carId: number, favorite: boolean) => {
        const favorites = getFavorites();
        if (favorite) {
            if (!favorites.includes(carId)) favorites.push(carId);
        } else {
            const index = favorites.indexOf(carId);
            if (index > -1) favorites.splice(index, 1);
        }
        localStorage.setItem('carFavorites', JSON.stringify(favorites));
    };

    const handleFavoriteToggle = () => {
        if (!car) return;
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        saveFavorite(car.id, newFavoriteState);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: (string | null)[] = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            if (currentDate.getMonth() === month) {
                days.push(currentDate.toISOString().split('T')[0]);
            } else {
                days.push(null);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    const generateHours = (): string[] => {
        const hours: string[] = [];
        for (let h = 0; h < 24; h++) {
            hours.push(`${String(h).padStart(2, '0')}:00`);
        }
        return hours;
    };

    // ───── EFFECTS ─────
    
    // Sync slider when image viewer opens
    useEffect(() => {
        if (showImageViewer && imageSliderRef.current) {
            imageSliderRef.current.slickGoTo(currentImageIndex);
        }
    }, [showImageViewer, currentImageIndex]);
    // Fetch car and images from storage
    useEffect(() => {
        if (!carId) {
            return;
        }
        const fetchCar = async () => {
            const fetchedCar = await fetchCarById(Number(carId));
            if (!fetchedCar) {
                return;
            }
            
            // Fetch images from storage for this car
            let carName = (fetchedCar as any).name;
            if (!carName || carName.trim() === '') {
                carName = `${fetchedCar.make} ${fetchedCar.model}`;
            }
            
            const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
            
            // Update car with images from storage
            const carWithImages = {
                ...fetchedCar,
                image_url: mainImage || fetchedCar.image_url,
                photo_gallery: photoGallery.length > 0 ? photoGallery : fetchedCar.photo_gallery,
            };
            
            setCar(carWithImages);
        };
        fetchCar();
    }, [carId, navigate]);

    // Update favorite & selected image when car loads
    useEffect(() => {
        if (car) {
            const favorites = getFavorites();
            setIsFavorite(favorites.includes(car.id));
            setSelectedImage(car.image_url || '');
        }
    }, [car]);

    // Fetch rentals and calculate next available date
    useEffect(() => {
        const fetchCarAvailability = async () => {
            if (!car || !carId) return;
            
            try {
                const rentals = await fetchRentals();
                const now = new Date();
                
                // Filter rentals for this car that are active
                const carRentals = rentals.filter(rental => {
                    const rentalCarId = typeof rental.car_id === 'number' 
                        ? rental.car_id 
                        : parseInt(rental.car_id?.toString() || '0', 10);
                    return rentalCarId === car.id && rental.status === 'ACTIVE';
                });
                
                // Find the latest return date from active rentals
                let latestReturnDate: Date | null = null;
                
                carRentals.forEach(rental => {
                    if (rental.end_date) {
                        const returnDate = new Date(rental.end_date);
                        // Add return time if available
                        if (rental.end_time) {
                            const [hours, minutes] = rental.end_time.split(':').map(Number);
                            returnDate.setHours(hours || 17, minutes || 0, 0, 0);
                        } else {
                            returnDate.setHours(17, 0, 0, 0); // Default return time
                        }
                        
                        if (returnDate > now && (!latestReturnDate || returnDate > latestReturnDate)) {
                            latestReturnDate = returnDate;
                        }
                    }
                });
                
                setNextAvailableDate(latestReturnDate);
            } catch (error) {
                console.error('Error fetching car availability:', error);
            }
        };
        
        fetchCarAvailability();
    }, [car, carId]);

    // Scroll to top on car change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId, car?.image_url]);

    // Define gallery early
    const gallery = (car?.photo_gallery ?? [car?.image_url]).filter((url): url is string => typeof url === 'string' && url.length > 0);

    // Keyboard navigation for image viewer
    useEffect(() => {
        if (!showImageViewer || gallery.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowImageViewer(false);
            } else if (e.key === 'ArrowLeft' && gallery.length > 1) {
                setCurrentImageIndex((prev) => 
                    prev > 0 ? prev - 1 : gallery.length - 1
                );
            } else if (e.key === 'ArrowRight' && gallery.length > 1) {
                setCurrentImageIndex((prev) => 
                    prev < gallery.length - 1 ? prev + 1 : 0
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showImageViewer, gallery.length]);

    // Sync calendar months with selected dates
    useEffect(() => {
        if (pickupDate) setCalendarMonth(prev => ({ ...prev, pickup: new Date(pickupDate) }));
    }, [pickupDate]);

    useEffect(() => {
        if (returnDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(returnDate) }));
        } else if (pickupDate) {
            const nextMonth = new Date(pickupDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
        }
    }, [returnDate, pickupDate]);

    // Click outside for calendars & time selectors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickupCalendarRef.current && !pickupCalendarRef.current.contains(event.target as Node))
                setShowPickupCalendar(false);
            if (returnCalendarRef.current && !returnCalendarRef.current.contains(event.target as Node))
                setShowReturnCalendar(false);
            if (pickupTimeRef.current && !pickupTimeRef.current.contains(event.target as Node))
                setShowPickupTime(false);
            if (returnTimeRef.current && !returnTimeRef.current.contains(event.target as Node))
                setShowReturnTime(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ───── DERIVED DATA ─────
    // gallery is defined earlier before useEffect hooks

    if (!carId || car === null) {
        // Show placeholder / not found component while loading or if invalid
        return <CarNotFound />;
    }

    // rental calculation, etc.
    const calculateRental = () => {
        if (!pickupDate || !returnDate || !pickupTime || !returnTime) return null;
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const returnDateTime = new Date(`${returnDate}T${returnTime}`);
        const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;

        const rentalDays = days;
        const totalDays = days + hours / 24;
        const basePricePerDay = (car as any).pricePerDay || car.price_per_day || 0;
        const carDiscount = (car as any).discount_percentage || car.discount_percentage || 0;
        const pricePerDay = carDiscount > 0 ? basePricePerDay * (1 - carDiscount / 100) : basePricePerDay;

        let basePrice = rentalDays >= 8 ? pricePerDay * 0.96 * rentalDays
            : rentalDays >= 4 ? pricePerDay * 0.98 * rentalDays
                : pricePerDay * rentalDays;

        if (hours > 0) basePrice += (hours / 24) * pricePerDay;

        const totalPrice = Math.round(basePrice);
        const finalPricePerDay = totalDays > 0 ? Math.round(totalPrice / totalDays) : pricePerDay;

        return { days, hours, pricePerDay: finalPricePerDay, totalPrice };
    };

    const rentalCalculation = calculateRental();
    const isBookingComplete = pickupDate && returnDate && pickupTime && returnTime;

    const handleBooking = () => {
        if (!isBookingComplete) return;
        setShowRentalModal(true);
    };

    // Remove duplicate gallery definition if it exists later
    // const gallery = (car?.photo_gallery ?? [car?.image_url]).filter(Boolean);

    return (
        <div id='individual-car-page' className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
                {/* Main Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_460px] gap-12">
                    {/* LEFT: Car Details */}
                    <div className="lg:col-start-1">
                        {/* Car Title & Rating - Mobile */}
                        <div className="mb-8 lg:hidden">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{car.make + ' ' + car.model}</h1>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-gray-400 fill-current" />
                                    <span className="font-semibold text-gray-900">{car.rating}</span>
                                </div>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">{car.reviews} recenzii</span>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="relative rounded-lg overflow-hidden bg-white shadow-sm mb-6 border border-gray-200">
                            <div 
                                className="relative w-full h-[450px] md:h-[600px] overflow-hidden"
                                onTouchStart={(e) => {
                                    if (gallery.length > 1) {
                                        const touch = e.touches[0];
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onTouchMove={(e) => {
                                    if (gallery.length > 1) {
                                        const touch = e.touches[0];
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (gallery.length > 1) {
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onClick={() => {
                                    const index = gallery.findIndex(img => img === selectedImage);
                                    setCurrentImageIndex(index >= 0 ? index : 0);
                                    setShowImageViewer(true);
                                }}
                            >
                                <div className="flex transition-transform duration-300 ease-out photo-gallery h-full">
                                    {gallery.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative w-full h-full flex-shrink-0"
                                            style={{ minWidth: '100%' }}
                                        >
                                            <img
                                                src={photo}
                                                alt={`${car.make} ${car.model} - Photo ${index + 1}`}
                                                className="w-full h-full object-cover cursor-pointer select-none"
                                                draggable={false}
                                            />
                                </div>
                                    ))}
                                </div>
                                
                                {/* Expand Icon */}
                                <div className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const index = gallery.findIndex(img => img === selectedImage);
                                        setCurrentImageIndex(index >= 0 ? index : 0);
                                        setShowImageViewer(true);
                                    }}
                                    title="View fullscreen"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Availability Badge */}
                            {(() => {
                                const isAvailable = car.status === 'available' || car.status === 'Available';
                                const isBooked = !isAvailable && (nextAvailableDate !== null);
                                
                                const formatDateForDisplay = (date: Date): string => {
                                    const day = date.getDate();
                                    const monthNames = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 
                                                       'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
                                    const month = monthNames[date.getMonth()];
                                    
                                    // Format date in Romanian: "Liber de pe 30 noiembrie"
                                    return `Liber de pe ${day} ${month}`;
                                };
                                
                                const availabilityText = isBooked && nextAvailableDate 
                                    ? formatDateForDisplay(nextAvailableDate)
                                    : (car.status === 'available' || car.status === 'Available' ? 'Disponibil' : car.status || '');
                                
                                if (!availabilityText) return null;
                                
                                return (
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs font-normal shadow-sm flex items-center gap-1.5">
                                        <svg className="w-3 h-3 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="whitespace-nowrap">{availabilityText}</span>
                                    </div>
                                );
                            })()}

                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                                {gallery.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedImage(src || '');
                                            setCurrentImageIndex(i);
                                            
                                            // Update transform
                                            const imageContainer = document.querySelector('.photo-gallery') as HTMLElement;
                                            if (imageContainer) {
                                                const translateX = -(i * 100);
                                                imageContainer.style.transform = `translateX(${translateX}%)`;
                                            }
                                        }}
                                        className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === src
                                            ? 'border-theme-500 ring-2 ring-theme-100'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={src || ''}
                                            alt={`${car.make} ${car.model}-${i}`}
                                            className="w-full h-20 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Mobile Booking Widget - Above Specifications */}
                        <div className="lg:hidden mb-6">
                            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6">
                                {/* Price Display */}
                                <div className="mb-4">
                                    {(() => {
                                        const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                        const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                        const finalPrice = discount > 0
                                            ? basePrice * (1 - discount / 100)
                                            : basePrice;

                                        return (
                                            <>
                                                <div className="text-3xl font-bold text-gray-900 mb-2">
                                                    {finalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MDL <span className="text-base font-normal text-gray-600">pe zi</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div className="text-sm text-gray-400 line-through mb-1">
                                                        {basePrice.toLocaleString('ro-RO')} MDL
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    {(finalPrice / 19.82).toFixed(2)} EUR / {(finalPrice / 17.00).toFixed(2)} USD pe zi
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Title */}
                                <h2 className="text-base font-semibold text-gray-900 mb-4">
                                    Închiriere {car.make} {car.model}, {car.year} an
                                </h2>

                                {/* Phone Button */}
                                <a
                                    href="tel:+37362000112"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-xl mb-3 transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>+373 (62) 000-112</span>
                                </a>

                                {/* Telegram Button */}
                                <a
                                    href="https://t.me/Level_Auto_Rental"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3 px-4 rounded-xl mb-3 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Scrie-ne pe Telegram</span>
                                </a>

                                {/* Help Text */}
                                <p className="text-center text-sm text-gray-500 mb-4">
                                    Ne puteți scrie sau apela, vă vom ajuta
                                </p>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {/* Pickup Date */}
                                    <div className="relative" ref={pickupCalendarRef}>
                                        <button
                                            onClick={() => {
                                                setShowPickupCalendar(!showPickupCalendar);
                                                setShowReturnCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 px-3 transition-colors text-xs font-medium ${pickupDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs">{pickupDate ? formatDate(pickupDate) : 'Data primirii'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const isPast = dayString < today.toISOString().split('T')[0];
                                                            
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? new Date(dayString) < new Date(nextAvailableDate.toISOString().split('T')[0])
                                                                : false;
                                                            const isBlocked = isPast || isBeforeAvailable;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${dayString === pickupDate
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isBlocked
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            setPickupDate(day);
                                                                            setShowPickupCalendar(false);
                                                                            if (returnDate && day >= returnDate) {
                                                                                const newReturnDate = new Date(day);
                                                                                newReturnDate.setDate(newReturnDate.getDate() + 1);
                                                                                setReturnDate(newReturnDate.toISOString().split('T')[0]);
                                                                            }
                                                                            setTimeout(() => {
                                                                                if (!pickupTime) {
                                                                                    setShowPickupTime(true);
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                >
                                                                    {dayDate.getDate()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="relative" ref={pickupTimeRef}>
                                        <button
                                            onClick={() => {
                                                setShowPickupTime(!showPickupTime);
                                                setShowReturnTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 px-3 transition-colors text-xs font-medium ${pickupTime
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs">{pickupTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto min-w-[80px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => {
                                                            const [hourNum, minuteNum] = hour.split(':').map(Number);
                                                            const hourDate = pickupDate 
                                                                ? new Date(`${pickupDate}T${hour}`)
                                                                : null;
                                                            
                                                            const isHourBlocked = nextAvailableDate && hourDate
                                                                ? hourDate < nextAvailableDate
                                                                : false;
                                                            
                                                            return (
                                                                <button
                                                                    key={hour}
                                                                    onClick={() => {
                                                                        if (!isHourBlocked) {
                                                                            setPickupTime(hour);
                                                                            setShowPickupTime(false);
                                                                            setTimeout(() => {
                                                                                if (!returnDate) {
                                                                                    setShowReturnCalendar(true);
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                    disabled={isHourBlocked}
                                                                    className={`w-full px-3 py-2 text-xs rounded transition-colors text-center ${
                                                                        isHourBlocked
                                                                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                                                                            : pickupTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {hour}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Return Date */}
                                    <div className="relative" ref={returnCalendarRef}>
                                        <button
                                            onClick={() => {
                                                setShowReturnCalendar(!showReturnCalendar);
                                                setShowPickupCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 px-3 transition-colors text-xs font-medium ${returnDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs">{returnDate ? formatDate(returnDate) : 'Data returnării'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const isPast = dayString < today.toISOString().split('T')[0];
                                                            
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? new Date(dayString) < new Date(nextAvailableDate.toISOString().split('T')[0])
                                                                : false;
                                                            const isBeforePickup = pickupDate && dayString <= pickupDate;
                                                            const isBlocked = isPast || isBeforeAvailable || isBeforePickup;
                                                            const isSelected = dayString === returnDate;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${isSelected
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isBlocked
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            setReturnDate(day);
                                                                            setShowReturnCalendar(false);
                                                                            setTimeout(() => {
                                                                                if (!returnTime) {
                                                                                    setShowReturnTime(true);
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                >
                                                                    {dayDate.getDate()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Return Time */}
                                    <div className="relative" ref={returnTimeRef}>
                                        <button
                                            onClick={() => {
                                                setShowReturnTime(!showReturnTime);
                                                setShowPickupTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 px-3 transition-colors text-xs font-medium ${returnTime
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs">{returnTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto min-w-[80px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                    setReturnTime(hour);
                                                                    setShowReturnTime(false);
                                                                }}
                                                                className={`w-full px-3 py-2 text-xs rounded transition-colors text-center ${returnTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {hour}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Choose Dates Button */}
                                <div className="mb-4">
                                    {isBookingComplete ? (
                                        <button
                                            onClick={handleBooking}
                                            className="w-full font-semibold py-3 px-4 rounded-xl transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer text-sm"
                                        >
                                            Închiriază
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full font-semibold py-3 px-4 rounded-xl transition-colors bg-gray-200 text-gray-400 cursor-not-allowed text-sm"
                                        >
                                            Alegeți datele
                                        </button>
                                    )}
                                </div>

                                {/* Pricing Tiers */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Costul închirierii</h3>

                                    <div className="space-y-2">
                                        {/* 1 day */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">De la 1 zi</span>
                                            <div className="text-right">
                                                <div className="text-base font-bold text-gray-900">
                                                    {car.price_per_day.toLocaleString('ro-RO')} MDL <span className="text-xs font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">De la 4 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-2%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.98).toLocaleString('ro-RO')} MDL <span className="text-xs font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 8 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">De la 8 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-4%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.96).toLocaleString('ro-RO')} MDL <span className="text-xs font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Car Specifications */}
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-6">
                            {/* Section Header */}
                            <div className="mb-8">
                                <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                    Specificații
                                </span>
                                <h2 className="mt-3 text-3xl font-bold text-gray-800 leading-tight">
                                    Caracteristici vehicul
                                </h2>
                            </div>
                            
                            {/* Main Specs Grid - Compact Layout */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Locuri</div>
                                        <div className="text-sm font-bold text-gray-800">{car.seats}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {(() => {
                                            const trans = car.transmission?.trim() || '';
                                            const isManual = trans.toLowerCase() === 'manual' || trans === 'Manual';
                                            const IconComponent = isManual ? TbManualGearboxFilled : TbAutomaticGearboxFilled;
                                            return React.createElement(IconComponent as any, { className: "w-5 h-5 text-white" });
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Transmisie</div>
                                        <div className="text-sm font-bold text-gray-800">
                                            {(() => {
                                                const trans = car.transmission?.trim() || '';
                                                if (trans.toLowerCase() === 'automatic' || trans === 'Automatic') {
                                                    return 'Automată';
                                                }
                                                if (trans.toLowerCase() === 'manual' || trans === 'Manual') {
                                                    return 'Manuală';
                                                }
                                                return trans || 'Automată';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {React.createElement(RiGasStationLine as any, { className: "w-5 h-5 text-white" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Combustibil</div>
                                        <div className="text-sm font-bold text-gray-800">
                                            {car.fuel_type === 'gasoline' ? 'Benzină' :
                                                car.fuel_type === 'diesel' ? 'Diesel' :
                                                    car.fuel_type === 'petrol' ? 'Benzină' :
                                                        car.fuel_type === 'hybrid' ? 'Hibrid' :
                                                            car.fuel_type === 'electric' ? 'Electric' : car.fuel_type}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {React.createElement(LiaCarSideSolid as any, { className: "w-5 h-5 text-white" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Caroserie</div>
                                        <div className="text-sm font-bold text-gray-800">{car.body}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Specs */}
                            {(car.power || car.acceleration || car.fuel_consumption) && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                                        <Gauge className="w-4 h-4 text-gray-500" />
                                        Specificații tehnice
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {car.power && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Zap className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Putere</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.power}</div>
                                            </div>
                                        )}
                                        {car.acceleration && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Gauge className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accelerație</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.acceleration}</div>
                                            </div>
                                        )}
                                        {car.fuel_consumption && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Fuel className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consum</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.fuel_consumption} L/100km</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features & Equipment */}
                        {car.features && car.features.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-6">
                                <div className="mb-6">
                                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                        Echipament
                                    </span>
                                    <h2 className="mt-3 text-3xl font-bold text-gray-800 leading-tight">
                                        Echipament inclus
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {car.features.map((feature, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-300 hover:shadow-md transition-all group"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Rental Options */}
                        <RentalOptionsSection />

                        {/* Contract Section */}
                        <ContractSection />

                    </div>

                    {/* RIGHT: Booking Widget */}
                    <aside className="lg:col-start-2">
                        <div
                            className="sticky"
                            style={{ top: 'calc(6rem + env(safe-area-inset-top))' }}
                        >
                            {/* Booking Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                {/* Price Display */}
                                <div className="mb-4">
                                    {(() => {
                                        const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                        const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                        const finalPrice = discount > 0
                                            ? basePrice * (1 - discount / 100)
                                            : basePrice;

                                        return (
                                            <>
                                                <div className="text-4xl font-bold text-gray-900 mb-2">
                                                    {finalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MDL <span className="text-lg font-normal text-gray-600">pe zi</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div className="text-sm text-gray-400 line-through mb-1">
                                                        {basePrice.toLocaleString('ro-RO')} MDL
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    {(finalPrice / 19.82).toFixed(2)} EUR / {(finalPrice / 17.00).toFixed(2)} USD pe zi
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Title */}
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                    Închiriere {car.make} {car.model}, {car.year} an
                                </h2>

                                {/* Phone Button */}
                                <a
                                    href="tel:+37362000112"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>+373 (62) 000-112</span>
                                </a>

                                {/* Telegram Button */}
                                <a
                                    href="https://t.me/Level_Auto_Rental"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Scrie-ne pe Telegram</span>
                                </a>

                                {/* Help Text */}
                                <p className="text-center text-sm text-gray-500 mb-6">
                                    Ne puteți scrie sau apela, vă vom ajuta
                                </p>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {/* Pickup Date */}
                                    <div className="relative" ref={pickupCalendarRef}>
                                        <button
                                            onClick={() => {
                                                setShowPickupCalendar(!showPickupCalendar);
                                                setShowReturnCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${pickupDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{pickupDate ? formatDate(pickupDate) : 'Data primirii'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const isSelected = dayString === pickupDate;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const isPast = dayString < today.toISOString().split('T')[0];
                                                            
                                                            // Check if date is before next available date
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? new Date(dayString) < new Date(nextAvailableDate.toISOString().split('T')[0])
                                                                : false;
                                                            const isBlocked = isPast || isBeforeAvailable;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${isSelected
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isBlocked
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            setPickupDate(day);
                                                                            setShowPickupCalendar(false);
                                                                            // Only adjust return date if it's already set and invalid
                                                                            if (returnDate && day >= returnDate) {
                                                                                const newReturnDate = new Date(day);
                                                                                newReturnDate.setDate(newReturnDate.getDate() + 1);
                                                                                setReturnDate(newReturnDate.toISOString().split('T')[0]);
                                                                            }
                                                                            // Auto-open pickup time picker after selecting date
                                                                            setTimeout(() => {
                                                                                if (!pickupTime) {
                                                                                    setShowPickupTime(true);
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                >
                                                                    {dayDate.getDate()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="relative" ref={pickupTimeRef}>
                                        <button
                                            onClick={() => {
                                                setShowPickupTime(!showPickupTime);
                                                setShowReturnTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${pickupTime
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{pickupTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto min-w-[80px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => {
                                                            // Check if this hour is blocked (before next available date/time)
                                                            const [hourNum, minuteNum] = hour.split(':').map(Number);
                                                            const hourDate = pickupDate 
                                                                ? new Date(`${pickupDate}T${hour}`)
                                                                : null;
                                                            
                                                            const isHourBlocked = nextAvailableDate && hourDate
                                                                ? hourDate < nextAvailableDate
                                                                : false;
                                                            
                                                            return (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                        if (!isHourBlocked) {
                                                                    setPickupTime(hour);
                                                                    setShowPickupTime(false);
                                                                    // Auto-open return date picker after selecting time
                                                                    setTimeout(() => {
                                                                        if (!returnDate) {
                                                                            setShowReturnCalendar(true);
                                                                        }
                                                                    }, 100);
                                                                        }
                                                                    }}
                                                                    disabled={isHourBlocked}
                                                                    className={`w-full px-3 py-2 text-xs rounded transition-colors text-center ${
                                                                        isHourBlocked
                                                                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                                                                            : pickupTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {hour}
                                                            </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Return Date */}
                                    <div className="relative" ref={returnCalendarRef}>
                                        <button
                                            onClick={() => {
                                                setShowReturnCalendar(!showReturnCalendar);
                                                setShowPickupCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${returnDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{returnDate ? formatDate(returnDate) : 'Data returnării'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const isPast = dayString < today.toISOString().split('T')[0];
                                                            
                                                            // Check if date is before next available date or before pickup date
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? new Date(dayString) < new Date(nextAvailableDate.toISOString().split('T')[0])
                                                                : false;
                                                            const isBeforePickup = pickupDate && dayString <= pickupDate;
                                                            const isBlocked = isPast || isBeforeAvailable || isBeforePickup;
                                                            const isSelected = dayString === returnDate;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${isSelected
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isBlocked
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            setReturnDate(day);
                                                                            setShowReturnCalendar(false);
                                                                            // Auto-open return time picker after selecting date
                                                                            setTimeout(() => {
                                                                                if (!returnTime) {
                                                                                    setShowReturnTime(true);
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                >
                                                                    {dayDate.getDate()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Return Time */}
                                    <div className="relative" ref={returnTimeRef}>
                                        <button
                                            onClick={() => {
                                                setShowReturnTime(!showReturnTime);
                                                setShowPickupTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${returnTime
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{returnTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto min-w-[80px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                    setReturnTime(hour);
                                                                    setShowReturnTime(false);
                                                                }}
                                                                className={`w-full px-3 py-2 text-xs rounded transition-colors text-center ${returnTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {hour}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Rental Calculation Display */}
                                {rentalCalculation && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-2">
                                            Preț pentru {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                            {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {rentalCalculation.totalPrice.toLocaleString('ro-RO')} MDL
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Total</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {rentalCalculation.totalPrice.toLocaleString('ro-RO')} MDL
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Choose Dates Button + Heart */}
                                <div className="flex gap-3 mb-6">
                                    {isBookingComplete ? (
                                        <button
                                            onClick={handleBooking}
                                            className="flex-1 font-semibold py-3.5 px-6 rounded-xl transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                        >
                                            Închiriază
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 font-semibold py-3.5 px-6 rounded-xl transition-colors bg-gray-200 text-gray-400 cursor-not-allowed"
                                        >
                                            Alegeți datele
                                        </button>
                                    )}
                                    <button
                                        onClick={handleFavoriteToggle}
                                        className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {React.createElement(BiSolidHeart as any, {
                                            className: `w-6 h-6 transition-all duration-300 ${isFavorite
                                                ? 'text-red-500'
                                                : 'text-gray-600 hover:text-red-500'
                                                }`
                                        })}
                                    </button>
                                </div>

                                {/* Pricing Tiers */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Costul închirierii</h3>

                                    <div className="space-y-3">
                                        {/* 1 day */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">De la 1 zi</span>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {car.price_per_day.toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 4 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-2%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.98).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 8 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 8 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-4%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.96).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

            </div>

            {/* Rental Request Modal */}
            {car && rentalCalculation && (
                <RentalRequestModal
                    isOpen={showRentalModal}
                    onClose={() => setShowRentalModal(false)}
                    car={car}
                    pickupDate={pickupDate}
                    returnDate={returnDate}
                    pickupTime={pickupTime}
                    returnTime={returnTime}
                    rentalCalculation={rentalCalculation}
                />
            )}

            {/* Image Gallery Modal - Same design as admin page */}
            {showImageViewer && createPortal(
                <AnimatePresence>
                    {showImageViewer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                            onClick={() => setShowImageViewer(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setShowImageViewer(false);
                                } else if (e.key === 'ArrowLeft' && gallery.length > 1) {
                                    const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : gallery.length - 1;
                                    setCurrentImageIndex(prevIndex);
                                    imageSliderRef.current?.slickGoTo(prevIndex);
                                } else if (e.key === 'ArrowRight' && gallery.length > 1) {
                                    const nextIndex = currentImageIndex < gallery.length - 1 ? currentImageIndex + 1 : 0;
                                    setCurrentImageIndex(nextIndex);
                                    imageSliderRef.current?.slickGoTo(nextIndex);
                                }
                            }}
                            tabIndex={0}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full h-full flex flex-col"
                                onKeyDown={(e) => e.stopPropagation()}
                            >
                                {/* Header Bar */}
                                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        {gallery.length > 1 && (
                                            <span className="text-white/70 text-sm font-medium">
                                                {currentImageIndex + 1} of {gallery.length}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowImageViewer(false)}
                                        className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                                    >
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Image Display with smooth slider */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                                    {gallery.length > 0 && (
                                        <div className="w-full h-full max-w-full max-h-[75vh] flex items-center justify-center">
                                            <style>{`
                                                .image-viewer-slider .slick-list {
                                                    height: 100%;
                                                    overflow: visible;
                                                }
                                                .image-viewer-slider .slick-track {
                                                    height: 100%;
                                                    display: flex;
                                                    align-items: center;
                                                    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                                                }
                                                .image-viewer-slider .slick-slide {
                                                    height: auto;
                                                    transition: opacity 0.3s ease;
                                                    padding: 0 10px;
                                                }
                                                .image-viewer-slider .slick-slide > div {
                                                    height: 100%;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    width: 100%;
                                                }
                                                .image-viewer-slider .slick-arrow {
                                                    display: none !important;
                                                }
                                            `}</style>
                                            <Slider
                                                ref={imageSliderRef}
                                                initialSlide={currentImageIndex}
                                                afterChange={(index) => setCurrentImageIndex(index)}
                                                infinite={gallery.length > 1}
                                                speed={400}
                                                slidesToShow={1}
                                                slidesToScroll={1}
                                                swipeToSlide={true}
                                                touchMove={true}
                                                draggable={true}
                                                fade={false}
                                                arrows={false}
                                                cssEase="cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                                                useCSS={true}
                                                useTransform={true}
                                                className="image-viewer-slider w-full h-full"
                                            >
                                                {gallery
                                                    .filter((url): url is string => typeof url === 'string' && url.length > 0)
                                                    .map((url, index) => (
                                                        <div key={index} className="flex items-center justify-center h-full">
                                                            <img
                                                                src={url}
                                                                alt={`${car.make} ${car.model} - Image ${index + 1}`}
                                                                className="max-w-full max-h-[75vh] object-contain rounded-xl select-none"
                                                                draggable={false}
                                                            />
                                                        </div>
                                                    ))}
                                            </Slider>
                                        </div>
                                    )}
                                </div>

                                {/* Photo Grid */}
                                {gallery.length > 1 && (
                                    <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                                        <div className="px-6 py-4">
                                            <div className="grid grid-cols-6 gap-3 max-w-4xl mx-auto">
                                                {gallery.map((url, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`relative transition-all ${currentImageIndex === index
                                                            ? 'opacity-100'
                                                            : 'opacity-50 hover:opacity-80'
                                                            }`}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className={`w-full h-20 object-cover rounded-lg transition-all ${currentImageIndex === index
                                                                ? 'border-2 border-white'
                                                                : 'border border-white/20'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
