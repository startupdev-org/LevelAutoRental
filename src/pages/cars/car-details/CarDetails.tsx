import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Calendar,
    ChevronRight,
    Phone,
    Send,
    Clock
} from 'lucide-react';
import { BiSolidHeart } from "react-icons/bi";
import { CarNotFound } from './CarNotFound';
import { RentalRequestModal } from '../../../components/modals/RentalRequestModal';
import { ContractSection } from '../section/ContractSection';
import { Car } from '../../../types';
import { fetchCarById } from '../../../lib/cars';
import { RentalOptionsSection } from '../section/RentalOptionsSection';

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

    // ───── REFS ─────
    const pickupCalendarRef = useRef<HTMLDivElement>(null);
    const returnCalendarRef = useRef<HTMLDivElement>(null);
    const pickupTimeRef = useRef<HTMLDivElement>(null);
    const returnTimeRef = useRef<HTMLDivElement>(null);

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
            hours.push(`${String(h).padStart(2, '0')}:30`);
        }
        return hours;
    };

    // ───── EFFECTS ─────
    // Fetch car
    useEffect(() => {
        if (!carId) {
            return;
        }
        const fetchCar = async () => {
            const fetchedCar = await fetchCarById(Number(carId));
            if (!fetchedCar) {
                return;
            }
            setCar(fetchedCar);
            console.log('the car is: ', fetchedCar)
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

    // Scroll to top on car change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId, car?.image_url]);

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
    const gallery = (car?.photo_gallery ?? [car?.image_url]).filter(Boolean);

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
                            <img
                                src={selectedImage}
                                alt={`${car.make} ${car.model}`}
                                className="w-full h-[450px] md:h-[600px] object-cover"
                            />

                            {/* Availability Badge */}
                            {car.status && (
                                <div
                                    className={`
                                absolute top-3 left-3 
                                px-3 py-1.5 
                                text-xs font-semibold rounded-lg 
                                flex items-center gap-1.5 
                                backdrop-blur-md transition-all 
                                whitespace-nowrap
                                ${car.status === 'available'
                                            ? 'bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 hover:border-green-500/60'
                                            : 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 hover:border-red-500/60'
                                        }
                            `}
                                >
                                    <svg
                                        className="w-3 h-3 flex-shrink-0 opacity-80"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {car.status}
                                </div>
                            )}

                            {/* Navigation arrows */}
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={() => {
                                            const currentIndex = gallery.findIndex(img => img === selectedImage);
                                            const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
                                            setSelectedImage(gallery[prevIndex] || '');
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 shadow-md transition-all border border-gray-200"
                                    >
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex = gallery.findIndex(img => img === selectedImage);
                                            const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
                                            setSelectedImage(gallery[nextIndex] || '');
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 shadow-md transition-all border border-gray-200"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                                {gallery.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(src || '')}
                                        className={`rounded-lg overflow-hidden border-2 transition-all ${selectedImage === src
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

                        {/* Car Specifications */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Caracteristici vehicul</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Locuri</div>
                                    <div className="text-lg font-semibold text-gray-900">{car.seats}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transmisie</div>
                                    <div className="text-lg font-semibold text-gray-900">
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
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Combustibil</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {car.fuel_type === 'gasoline' ? 'Benzină' :
                                            car.fuel_type === 'diesel' ? 'Diesel' :
                                                car.fuel_type === 'petrol' ? 'Benzină' :
                                                    car.fuel_type === 'hybrid' ? 'Hibrid' :
                                                        car.fuel_type === 'electric' ? 'Electric' : car.fuel_type}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Caroserie</div>
                                    <div className="text-lg font-semibold text-gray-900">{car.body}</div>
                                </div>
                            </div>

                            {/* Additional Specs */}
                            {(car.power || car.acceleration || car.fuel_consumption) && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Specificații tehnice</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {car.power && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Putere</div>
                                                <div className="text-base font-medium text-gray-900">{car.power}</div>
                                            </div>
                                        )}
                                        {car.acceleration && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Accelerație</div>
                                                <div className="text-base font-medium text-gray-900">{car.acceleration}</div>
                                            </div>
                                        )}
                                        {car.fuel_consumption && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Consum</div>
                                                <div className="text-base font-medium text-gray-900">{car.fuel_consumption} L/100km</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features & Equipment */}
                        {car.features && car.features.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Echipament inclus</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {car.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-theme-500 flex-shrink-0"></div>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Despre acest vehicul</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {car.long_description ?? car.description ??
                                    `Inchiriați ${car.make} ${car.model} ${car.year} pentru experiențe premium de conducere. Acest vehicul ${car.body || ''.toLowerCase()} oferă confort și performanță superioară, perfect pentru călătorii de afaceri sau vacanțe. Vehiculul este bine întreținut și echipat cu toate dotările moderne pentru siguranță și confort.`
                                }
                            </p>
                        </div>

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
                                    Închiriere {car.make} {car.model}, {car.year} an în Chișinău
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
                                                            const isPast = dayString < new Date().toISOString().split('T')[0];

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${isSelected
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isPast
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isPast) {
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
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                    setPickupTime(hour);
                                                                    setShowPickupTime(false);
                                                                    // Auto-open return date picker after selecting time
                                                                    setTimeout(() => {
                                                                        if (!returnDate) {
                                                                            setShowReturnCalendar(true);
                                                                        }
                                                                    }, 100);
                                                                }}
                                                                className={`px-3 py-2 text-xs rounded transition-colors ${pickupTime === hour
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
                                                            const isSelected = dayString === returnDate;
                                                            const minReturnDate = pickupDate || new Date().toISOString().split('T')[0];
                                                            const isPast = dayString < minReturnDate;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                                                        } ${isSelected
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : !isPast
                                                                                ? 'hover:bg-gray-100'
                                                                                : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isPast) {
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
                                                    className="absolute z-50 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                    setReturnTime(hour);
                                                                    setShowReturnTime(false);
                                                                }}
                                                                className={`px-3 py-2 text-xs rounded transition-colors ${returnTime === hour
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
                                            style={{ backgroundColor: '#F4A6A6' }}
                                            className="flex-1 font-semibold py-3.5 px-6 rounded-xl transition-colors hover:bg-[#F29999] text-white cursor-pointer"
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

                {/* Sticky Mobile Booking Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden z-50 p-4">
                    <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
                        <div>
                            {rentalCalculation ? (
                                <>
                                    <div className="text-xl font-bold text-gray-900">
                                        {rentalCalculation.totalPrice.toLocaleString('ro-RO')} MDL
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-xl font-bold text-gray-900">
                                        {car.price_per_day.toLocaleString('ro-RO')} MDL
                                    </div>
                                    <div className="text-xs text-gray-500">pe zi</div>
                                </>
                            )}
                        </div>
                        {isBookingComplete ? (
                            <button
                                onClick={handleBooking}
                                style={{ backgroundColor: '#F4A6A6' }}
                                className="flex-1 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors text-sm hover:bg-[#F29999] text-white cursor-pointer"
                            >
                                Închiriază
                            </button>
                        ) : (
                            <button
                                disabled
                                className="flex-1 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                                Alegeți datele
                            </button>
                        )}
                    </div>
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
        </div>
    );
};
