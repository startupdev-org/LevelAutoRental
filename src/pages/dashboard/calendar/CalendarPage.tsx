import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    format,
    isSameMonth,
    addMonths,
    subMonths,
} from "date-fns";
import { fetchCars } from "../../../lib/cars";
import { fetchImagesByCarName } from "../../../lib/db/cars/cars";
import { Car } from "../../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, User, Clock, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { OrderDetailsModal } from "../../../components/modals/OrderDetailsModal";
import { OrderDisplay, fetchRentalsOnly } from "../../../lib/orders";
import { CalendarPageDesktop } from "./CalendarPageDesktop";
import { useTranslation } from 'react-i18next';

interface Props {
    viewMode: string | null;
}

export const CalendarPage: React.FC<Props> = () => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCar, setSelectedCar] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState<OrderDisplay[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [isDesktop, setIsDesktop] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Detect desktop viewport
    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const [filters, setFilters] = useState({
        make: "",
        model: "",
    });
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [sortBy, setSortBy] = useState<'time' | 'customer' | 'car' | 'status' | null>('time');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Fetch cars from Supabase and load images from storage
    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();

                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );

                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            }
        };
        loadCars();
    }, []);

    // Fetch orders with customer data (after cars are loaded)
    useEffect(() => {
        const loadOrders = async () => {
            if (cars.length === 0) return;
            try {
                const data = await fetchRentalsOnly(cars);
                // Filter to only rentals (not requests)
                const rentalsOnly = data.filter(order => order.type === 'rental');
                setOrders(rentalsOnly);
            } catch (error) {
                console.error('Failed to load orders:', error);
            }
        };
        loadOrders();
    }, [cars]);

    // Auto-select today when clicking outside the calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = format(today, "yyyy-MM-dd");
                setSelectedDate(todayStr);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const makeToModels = useMemo(() => {
        const mapping: Record<string, string[]> = {};
        cars.forEach((car) => {
            // Try to get make and model from car object
            let make = '';
            let model = '';

            // First, try to use make and model properties directly
            if ((car as any).make && (car as any).model) {
                make = (car as any).make;
                model = (car as any).model;
            } else {
                // Fallback to parsing from name
                const carName = (car as any).name || `${(car as any).make || ''} ${(car as any).model || ''}`.trim();
                const parts = carName.split(" ");
                const firstPart = parts[0];
                make = firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
                model = parts.slice(1).join(" ");
            }

            if (make) {
                if (!mapping[make]) mapping[make] = [];
                if (model && !mapping[make].includes(model)) mapping[make].push(model);
            }
        });
        return mapping;
    }, [cars]);

    const availableModels = useMemo(() => {
        if (!filters.make) return [];
        return makeToModels[filters.make] || [];
    }, [filters.make, makeToModels]);

    const uniqueMakes = useMemo(() => {
        const makes = cars.map((car) => {
            // Try to get make directly from car object
            if ((car as any).make) {
                const make = (car as any).make;
                return make.includes("-") ? make.split("-")[0] : make;
            }

            // Fallback to parsing from name
            const carName = (car as any).name || '';
            const firstPart = carName.split(" ")[0];
            return firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
        }).filter(make => make); // Filter out empty strings
        return [...new Set(makes)];
    }, [cars]);

    const handleFilterChange = (key: "make" | "model", value: string) => {
        setFilters((prev) => {
            let newFilters = { ...prev, [key]: value };

            // 1. Validate make
            if (key === "make" && value) {
                const validModels = makeToModels[value] || [];
                if (prev.model && !validModels.includes(prev.model)) {
                    newFilters.model = "";
                } else {
                    newFilters.make = value;
                    // Auto-select model if there's only one available
                    if (validModels.length === 1) {
                        newFilters.model = validModels[0];
                    }
                }
            } else if (key === "model" && value && newFilters.make) {
                const validModels = makeToModels[newFilters.make] || [];
                if (!validModels.includes(value)) {
                    newFilters.model = "";
                } else newFilters.model = value
            }

            // 3. Set selectedCar based on filters
            // If both make and model are selected, find the specific car
            // If only make is selected, set a special object to indicate make-only filter
            if (newFilters.make !== "" && newFilters.model !== "") {
                const matchingCars = cars.filter((car) => {
                    // Try to get make and model from car object
                    let make = '';
                    let model = '';

                    // First, try to use make and model properties directly
                    if ((car as any).make && (car as any).model) {
                        make = (car as any).make;
                        model = (car as any).model;
                    } else {
                        // Fallback to parsing from name
                        const carName = (car as any).name || '';
                        const parts = carName.split(" ");
                        const firstPart = parts[0];
                        make = firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
                        model = parts.slice(1).join(" ");
                    }

                    const matchesMake = newFilters.make ? make === newFilters.make : true;
                    const matchesModel = newFilters.model ? model === newFilters.model : true;

                    return matchesMake && matchesModel;
                });

                setSelectedCar(matchingCars.length > 0 ? matchingCars[0] : null);
            } else if (newFilters.make !== "") {
                // Only make selected - create a special object to represent make-only filter
                setSelectedCar({ make: newFilters.make, name: newFilters.make, id: null } as any);
            } else {
                setSelectedCar(null);
            }

            setFilters(newFilters);
            return newFilters;
        });
    };

    const closeAllDropdowns = () => {
        setShowMakeDropdown(false);
        setShowModelDropdown(false);
    };

    const openDropdown = (type: "make" | "model") => {
        if (type === "make") {
            setShowMakeDropdown((prev) => !prev);
            setShowModelDropdown(false);
        }
        if (type === "model" && filters.make) {
            setShowModelDropdown((prev) => !prev);
            setShowMakeDropdown(false);
        }
    };

    const handleSelectDay = (day: string) => {
        // Toggle selection - if clicking the same date, deselect it
        if (selectedDate === day) {
            setSelectedDate(null);
        } else {
            setSelectedDate(day);
        }
    };

    const getStatusDisplay = (status: string): { text: string; className: string } => {
        const statusUpper = status.toUpperCase();

        if (statusUpper === 'CONTRACT') {
            return {
                text: 'Contract',
                className: 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
            };
        } else if (statusUpper === 'ACTIVE') {
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

        // Fallback for payment statuses (legacy support)
        const statusLower = status.toLowerCase();
        if (statusLower === 'paid') {
            return {
                text: 'To Deliver',
                className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
            };
        } else if (statusLower === 'pending') {
            return {
                text: 'Not Paid',
                className: 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
            };
        } else {
            return {
                text: 'To Call',
                className: 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
            };
        }
    };


    const formatTime = (timeString: string) => {
        try {
            // Remove any AM/PM and convert to 24-hour format
            let cleanTime = timeString.trim();

            // Check if time has AM/PM
            const hasAMPM = /AM|PM/i.test(cleanTime);
            if (hasAMPM) {
                const isPM = /PM/i.test(cleanTime);
                cleanTime = cleanTime.replace(/AM|PM/gi, '').trim();
                const [hours, minutes] = cleanTime.split(':');
                let hour = parseInt(hours, 10);

                // Convert to 24-hour format
                if (isPM && hour !== 12) {
                    hour += 12;
                } else if (!isPM && hour === 12) {
                    hour = 0;
                }

                return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }

            // Handle both "HH:mm" and "HH:mm:ss" formats
            const time = cleanTime.split(':');
            if (time.length >= 2) {
                const hours = time[0].padStart(2, '0');
                const minutes = time[1].padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            return timeString;
        } catch {
            return timeString;
        }
    };

    // Get order number function - use actual database ID from Supabase
    const getOrderNumber = useMemo(() => {
        return (order: OrderDisplay) => {
            // Convert ID to number if it's a string, then format with leading zeros
            const id = typeof order.id === 'number' ? order.id : parseInt(order.id.toString(), 10);
            return id || 0;
        };
    }, []);

    // Get car make from car name
    const getCarMake = (carName: string): string => {
        const parts = carName.split(' ');
        const firstPart = parts[0];
        // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
        return firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
    };

    // Get car make logo path
    const getMakeLogo = (make: string): string | null => {
        const makeLower = make.toLowerCase();
        const logoMap: { [key: string]: string } = {
            'mercedes': '/LevelAutoRental/logos/merc.svg',
            'mercedes-benz': '/LevelAutoRental/logos/merc.svg',
            'bmw': '/LevelAutoRental/logos/bmw.webp',
            'audi': '/LevelAutoRental/logos/audi.png',
            'hyundai': '/LevelAutoRental/logos/hyundai.png',
            'maserati': '/LevelAutoRental/logos/maserati.png',
        };
        return logoMap[makeLower] || null;
    };

    // Get logo size class based on make
    const getLogoSize = (make: string): string => {
        const makeLower = make.toLowerCase();
        // Maserati and Audi need bigger logos
        if (makeLower === 'maserati' || makeLower === 'audi') {
            return 'w-6 h-6';
        }
        return 'w-4 h-4';
    };

    const eventsByDay = useMemo(() => {
        const pickupsMap = new Map<string, any[]>();
        const returnsMap = new Map<string, any[]>();

        // Filter orders based on make/model filters and exclude completed/cancelled
        let filteredOrders = orders.filter((o) => {
            // Exclude completed and cancelled orders
            const status = (o.status || '').toUpperCase();
            if (status === 'COMPLETED' || status === 'CANCELLED') {
                return false;
            }
            return true;
        });

        if (filters.make) {
            filteredOrders = filteredOrders.filter((o) => {
                const car = cars.find(c => c.id.toString() === o.carId.toString());
                if (!car) return false;

                // Try to get make and model from car object
                let make = '';
                let model = '';

                // First, try to use make and model properties directly
                if ((car as any).make && (car as any).model) {
                    make = (car as any).make;
                    model = (car as any).model;
                } else {
                    // Fallback to parsing from name
                    const carName = (car as any).name || '';
                    const parts = carName.split(" ");
                    const firstPart = parts[0];
                    make = firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
                    model = parts.slice(1).join(" ");
                }

                const matchesMake = make === filters.make;
                const matchesModel = filters.model ? model === filters.model : true;

                return matchesMake && matchesModel;
            });
        }

        filteredOrders.forEach((o) => {
            // Add order to its pickup date
            const pickupDate = format(new Date(o.pickupDate), "yyyy-MM-dd");
            if (!pickupsMap.has(pickupDate)) pickupsMap.set(pickupDate, []);
            pickupsMap.get(pickupDate)!.push(o);

            // Add order to its return date
            const returnDate = format(new Date(o.returnDate), "yyyy-MM-dd");
            if (!returnsMap.has(returnDate)) returnsMap.set(returnDate, []);
            returnsMap.get(returnDate)!.push(o);
        });

        return { pickups: pickupsMap, returns: returnsMap };
    }, [filters, orders, cars]);

    const handleSort = (field: 'time' | 'customer' | 'car' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const sortOrders = (orders: OrderDisplay[], isPickup: boolean): OrderDisplay[] => {
        if (!sortBy) return orders;

        const sorted = [...orders].sort((a, b) => {
            let diff = 0;

            switch (sortBy) {
                case 'time':
                    const timeA = isPickup ? formatTime(a.pickupTime) : formatTime(a.returnTime);
                    const timeB = isPickup ? formatTime(b.pickupTime) : formatTime(b.returnTime);
                    diff = timeA.localeCompare(timeB);
                    break;
                case 'customer':
                    diff = (a.customerName || '').localeCompare(b.customerName || '');
                    break;
                case 'car':
                    const carA = cars.find(c => c.id.toString() === a.carId.toString());
                    const carB = cars.find(c => c.id.toString() === b.carId.toString());
                    const carNameA = carA ? ((carA as any).name || '') : '';
                    const carNameB = carB ? ((carB as any).name || '') : '';
                    diff = carNameA.localeCompare(carNameB);
                    break;
                case 'status':
                    const statusA = a.status || '';
                    const statusB = b.status || '';
                    diff = statusA.localeCompare(statusB);
                    break;
                default:
                    return 0;
            }

            return sortOrder === 'asc' ? diff : -diff;
        });

        return sorted;
    };

    const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
    const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

    // Generate calendar days starting with Monday (not Sunday)
    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        // Adjust to start from Monday: if firstDay is Sunday (0), go back 6 days; otherwise go back (getDay() - 1) days
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 days back, Sunday = 6 days back
        startDate.setDate(startDate.getDate() - daysToSubtract);

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

    return (
        <div ref={calendarRef} className="max-w-[1600px] mx-auto px-0 sm:px6 lg:px-8">
            {/* Sort and Filter Row */}
            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                {/* Sort Controls */}
                <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-2 lg:gap-2">
                    {/* Mobile: Sortează după and Șterge Sortarea in same row */}
                    <div className="lg:hidden flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.calendar.sortBy')}</span>
                        {sortBy && sortBy !== 'time' && (
                            <button
                                onClick={() => {
                                    setSortBy('time');
                                    setSortOrder('asc');
                                }}
                                className="px-2.5 py-0 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                            >
                                {t('admin.calendar.clearSort')}
                            </button>
                        )}
                    </div>
                    {/* Desktop: Sortează după label */}
                    <span className="hidden lg:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.calendar.sortBy')}</span>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button
                            onClick={() => handleSort('car')}
                            className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'car'
                                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{t('admin.calendar.car')}</span>
                            {sortBy === 'car' && (
                                sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                            )}
                            {sortBy !== 'car' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                        </button>
                        <button
                            onClick={() => handleSort('status')}
                            className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'status'
                                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{t('admin.calendar.status')}</span>
                            {sortBy === 'status' && (
                                sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                            )}
                            {sortBy !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                        </button>
                        {/* Desktop: Șterge Sortarea */}
                        {sortBy && sortBy !== 'time' && (
                            <button
                                onClick={() => {
                                    setSortBy('time');
                                    setSortOrder('asc');
                                }}
                                className="hidden lg:block px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                            >
                                {t('admin.calendar.clearSort')}
                            </button>
                        )}
                        {/* Filter button on mobile - in same row */}
                        {!isDesktop && !selectedCar && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
                            >
                                <Filter className="w-3 h-3" />
                                <span>{showFilters ? t('admin.calendar.hideFilters') : t('admin.calendar.showFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Toggle Button - Desktop only */}
                <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    {selectedCar && (() => {
                        // If selectedCar has a make property but no id, it's a make-only filter
                        const isMakeOnly = (selectedCar as any).make && !(selectedCar as any).id;
                        const displayName = isMakeOnly ? (selectedCar as any).make : ((selectedCar as any).name || 'Selected Car');
                        const carMake = isMakeOnly ? (selectedCar as any).make : getCarMake(displayName);
                        const logoPath = getMakeLogo(carMake);
                        return (
                            <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium flex items-center gap-2 max-w-full">
                                {logoPath && (
                                    <img
                                        src={logoPath}
                                        alt={carMake}
                                        className={`${getLogoSize(carMake)} object-contain brightness-0 invert flex-shrink-0`}
                                        onError={(e) => {
                                            // Hide image if it fails to load
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <span className="truncate">{displayName}</span>
                            </div>
                        );
                    })()}
                    {(!selectedCar || isDesktop) && (
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
                        >
                            <Filter className="w-3 h-3" />
                            <span>{showFilters ? t('admin.calendar.hideFilters') : t('admin.calendar.showFilters')}</span>
                        </button>
                    )}
                </div>

                {/* Selected Car Badge - Mobile only (when filter button is hidden) */}
                {!isDesktop && selectedCar && (() => {
                    const isMakeOnly = (selectedCar as any).make && !(selectedCar as any).id;
                    const displayName = isMakeOnly ? (selectedCar as any).make : ((selectedCar as any).name || 'Selected Car');
                    const carMake = isMakeOnly ? (selectedCar as any).make : getCarMake(displayName);
                    const logoPath = getMakeLogo(carMake);
                    return (
                        <div className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 max-w-full">
                            {logoPath && (
                                <img
                                    src={logoPath}
                                    alt={carMake}
                                    className={`${getLogoSize(carMake)} object-contain brightness-0 invert flex-shrink-0`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <span className="truncate">{displayName}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilters({ make: "", model: "" });
                                    setSelectedCar(null);
                                }}
                                className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                                aria-label="Clear filter"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Filters Sidebar from Right - Rendered via Portal */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showFilters && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/50 z-[9998]"
                                onClick={() => setShowFilters(false)}
                            />
                            {/* Sidebar */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl z-[9999] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-white">Filters</h3>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {/* Make */}
                                        <div className="flex-1 relative dropdown-container z-[10000]">
                                            <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
                                                Marca
                                            </label>
                                            <div
                                                className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer border border-white/10 flex items-center gap-2 ${filters.make ? "text-white" : "text-white/70"}`}
                                                onClick={() => openDropdown("make")}
                                            >
                                                {filters.make && (() => {
                                                    const logoPath = getMakeLogo(filters.make.toLowerCase());
                                                    return logoPath ? (
                                                        <img
                                                            src={logoPath}
                                                            alt={filters.make}
                                                            className={`${getLogoSize(filters.make)} object-contain brightness-0 invert`}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : null;
                                                })()}
                                                <span>{filters.make || "Selectează marca"}</span>
                                            </div>
                                            <AnimatePresence>
                                                {showMakeDropdown && (
                                                    <>
                                                        {/* Backdrop for dropdown */}
                                                        <div
                                                            className="fixed inset-0 z-[10001]"
                                                            onClick={closeAllDropdowns}
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="absolute top-full left-0 right-0 mt-1 border border-white/20 rounded-xl shadow-2xl z-[10002] min-w-[200px] max-h-[300px] overflow-y-auto"
                                                            style={{ backgroundColor: '#363636' }}
                                                        >
                                                            <div
                                                                className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white"
                                                                onClick={() => {
                                                                    handleFilterChange("make", "");
                                                                    closeAllDropdowns();
                                                                }}
                                                            >
                                                                Selectează marca
                                                            </div>
                                                            {uniqueMakes.length > 0 ? (
                                                                uniqueMakes.map((make) => {
                                                                    const logoPath = getMakeLogo(make.toLowerCase());
                                                                    return (
                                                                        <div
                                                                            key={make}
                                                                            className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white flex items-center gap-2"
                                                                            onClick={() => {
                                                                                handleFilterChange("make", make);
                                                                                closeAllDropdowns();
                                                                            }}
                                                                        >
                                                                            <div className="w-6 flex items-center justify-center flex-shrink-0">
                                                                                {logoPath && (
                                                                                    <img
                                                                                        src={logoPath}
                                                                                        alt={make}
                                                                                        className={`${getLogoSize(make)} object-contain brightness-0 invert`}
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <span>{make}</span>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="px-4 py-2 text-white/50 text-sm">
                                                                    Nu sunt mașini disponibile
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Model */}
                                        <div className="flex-1 relative dropdown-container z-[9999]">
                                            <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
                                                Model
                                            </label>
                                            <div
                                                className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer border border-white/10 flex items-center gap-2 ${!filters.make ? "text-white/50 cursor-not-allowed" : "text-white"
                                                    }`}
                                                onClick={() => filters.make && openDropdown("model")}
                                            >
                                                {!filters.make ? "Selectează marca" : filters.model || "Orice"}
                                            </div>
                                            {showModelDropdown && filters.make && (
                                                <>
                                                    {/* Backdrop for dropdown */}
                                                    <div
                                                        className="fixed inset-0 z-[10001]"
                                                        onClick={closeAllDropdowns}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute top-full left-0 right-0 mt-1 border border-white/20 rounded-xl shadow-2xl z-[10002] min-w-[200px] max-h-[300px] overflow-y-auto"
                                                        style={{ backgroundColor: '#363636' }}
                                                    >
                                                        {availableModels.length > 1 && (
                                                            <div
                                                                className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white"
                                                                onClick={() => {
                                                                    handleFilterChange("model", "");
                                                                    closeAllDropdowns();
                                                                }}
                                                            >
                                                                Orice
                                                            </div>
                                                        )}
                                                        {availableModels.length > 0 ? (
                                                            availableModels.map((model) => {
                                                                return (
                                                                    <div
                                                                        key={model}
                                                                        className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white"
                                                                        onClick={() => {
                                                                            handleFilterChange("model", model);
                                                                            closeAllDropdowns();
                                                                        }}
                                                                    >
                                                                        {model}
                                                                    </div>
                                                                );
                                                            })
                                                        ) : filters.make ? (
                                                            <div className="px-4 py-2 text-white/50 text-sm">
                                                                Nu sunt modele disponibile
                                                            </div>
                                                        ) : null}
                                                    </motion.div>
                                                </>
                                            )}
                                        </div>

                                        {/* Apply Filters Button */}
                                        {(filters.make || filters.model) && (
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => {
                                                        setShowFilters(false);
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Apply Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Mobile View - Single Column */}
            {!isDesktop && (
                <>
                    {/* Calendar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4 sm:p-6"
                    >
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={prevMonth}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="text-sm font-medium text-white">
                                {currentMonth.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                            </div>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Weekday Header */}
                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                            {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((day, i) => (
                                <div key={day} className={`text-gray-400 font-medium ${i === 5 || i === 6 ? 'text-red-400' : ''}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays(currentMonth).map((day, index) => {
                                if (!day) return <div key={index}></div>;
                                const dayDate = new Date(day);
                                const dayString = day;
                                const hasPickups = eventsByDay.pickups.has(dayString);
                                const hasReturns = eventsByDay.returns.has(dayString);
                                const hasEvents = hasPickups || hasReturns;
                                const isInCurrentMonth = isSameMonth(dayDate, currentMonth);

                                // Check if this is today's date
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isToday = dayDate.getFullYear() === today.getFullYear() &&
                                    dayDate.getMonth() === today.getMonth() &&
                                    dayDate.getDate() === today.getDate();

                                // Check if this is a past date
                                const dayDateNormalized = new Date(dayDate);
                                dayDateNormalized.setHours(0, 0, 0, 0);
                                const isPast = dayDateNormalized < today;

                                // If no date is selected, treat today as selected
                                const isSelected = selectedDate === dayString || (selectedDate === null && isToday);

                                // Determine styling based on today, selected, events, and past dates
                                let dayClassName = '';
                                if (isToday && isSelected) {
                                    // Today when selected - red background with selection ring
                                    dayClassName = 'bg-red-500 text-white ring-1 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold';
                                } else if (isToday) {
                                    // Today always has red background
                                    dayClassName = 'bg-red-500 text-white';
                                } else if (isSelected) {
                                    // Selected (but not today) - show ring effect
                                    if (hasEvents) {
                                        if (isPast) {
                                            dayClassName = 'bg-gray-500/40 text-white ring-1 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold hover:bg-gray-500/50';
                                        } else {
                                            dayClassName = 'bg-yellow-500/20 text-white ring-1 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold hover:bg-yellow-500/30';
                                        }
                                    } else {
                                        dayClassName = 'ring-1 ring-white/60 ring-offset-1 ring-offset-transparent text-white hover:ring-white/50 bg-white/5 font-semibold';
                                    }
                                } else if (hasEvents) {
                                    if (isPast) {
                                        dayClassName = 'bg-gray-500/40 text-white hover:bg-gray-500/50';
                                    } else {
                                        dayClassName = 'bg-yellow-500/20 text-white hover:bg-yellow-500/30';
                                    }
                                } else {
                                    dayClassName = 'hover:bg-white/10';
                                }

                                return (
                                    <div
                                        key={index}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs rounded-xl transition-colors relative cursor-pointer ${!isInCurrentMonth ? 'text-gray-500' : 'text-white'
                                            } ${dayClassName}`}
                                        onClick={() => handleSelectDay(dayString)}
                                    >
                                        {dayDate.getDate()}
                                        {/* Dot indicator for days with events - yellow for today, gray for past, red for future */}
                                        {hasEvents && (
                                            <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isToday ? 'bg-yellow-500' : isPast ? 'bg-gray-500' : 'bg-red-500'
                                                }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Selected Date Information or Today's Events - Independent Section */}
                    {(() => {
                        // If a date is selected, show that date's events, otherwise show today's events
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const todayStr = format(today, "yyyy-MM-dd");
                        const displayDate = selectedDate || todayStr;
                        const displayDateObj = new Date(displayDate);

                        const selectedDayPickups = sortOrders(eventsByDay.pickups.get(displayDate) || [], true);
                        const selectedDayReturns = sortOrders(eventsByDay.returns.get(displayDate) || [], false);

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {displayDateObj.toLocaleDateString('ro-RO', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                        {!selectedDate && <span className="ml-2 text-sm text-gray-400">({t('admin.calendar.today')})</span>}
                                    </h3>
                                    {selectedDate && (
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="text-gray-400 hover:text-white transition-colors p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Pickups Section */}
                                {selectedDayPickups.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">{t('admin.calendar.pickups')} ({selectedDayPickups.length})</h4>
                                        <div className="space-y-3">
                                            {selectedDayPickups.map((order) => {
                                                const car = cars.find(c => c.id.toString() === order.carId.toString());
                                                const carName = car ? ((car as any).name || 'Unknown Car') : 'Unknown Car';
                                                const customerName = order.customerName || 'Unknown Customer';

                                                return (
                                                    <motion.div
                                                        key={order.id}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                                        <User className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-white text-sm">{customerName}</div>
                                                                        <div className="text-gray-400 text-xs">{t('admin.calendar.rental')} #{getOrderNumber(order).toString().padStart(4, '0')}</div>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const statusDisplay = getStatusDisplay(order.status);
                                                                    return (
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className} flex-shrink-0`}>
                                                                            {statusDisplay.text}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <span className="text-white/90 text-sm truncate">{carName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                                    <Clock className="w-4 h-4 text-yellow-400/70 flex-shrink-0" />
                                                                    <span className="text-yellow-400 text-lg font-bold tracking-tight">{formatTime(order.pickupTime)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Returns Section */}
                                {selectedDayReturns.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">{t('admin.calendar.returns')} ({selectedDayReturns.length})</h4>
                                        <div className="space-y-3">
                                            {selectedDayReturns.map((order) => {
                                                const car = cars.find(c => c.id.toString() === order.carId.toString());
                                                const carName = car ? ((car as any).name || 'Unknown Car') : 'Unknown Car';
                                                const customerName = order.customerName || 'Unknown Customer';

                                                return (
                                                    <motion.div
                                                        key={order.id}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                                        <User className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-white text-sm">{customerName}</div>
                                                                        <div className="text-gray-400 text-xs">{t('admin.calendar.rental')} #{getOrderNumber(order).toString().padStart(4, '0')}</div>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const statusDisplay = getStatusDisplay(order.status);
                                                                    return (
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className} flex-shrink-0`}>
                                                                            {statusDisplay.text}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <span className="text-white/90 text-sm truncate">{carName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                                    <Clock className="w-4 h-4 text-blue-400/70 flex-shrink-0" />
                                                                    <span className="text-blue-400 text-lg font-bold tracking-tight">{formatTime(order.returnTime)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedDayPickups.length === 0 && selectedDayReturns.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No bookings for this day
                                    </div>
                                )}
                            </motion.div>
                        );
                    })()}
                </>
            )}

            {/* Desktop View - Two Column Layout */}
            {isDesktop && (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = format(today, "yyyy-MM-dd");
                const displayDate = selectedDate || todayStr;
                const displayDateObj = new Date(displayDate);

                const selectedDayPickups = eventsByDay.pickups.get(displayDate) || [];
                const selectedDayReturns = eventsByDay.returns.get(displayDate) || [];

                return (
                    <CalendarPageDesktop
                        currentMonth={currentMonth}
                        prevMonth={prevMonth}
                        nextMonth={nextMonth}
                        generateCalendarDays={generateCalendarDays}
                        eventsByDay={eventsByDay}
                        selectedDate={selectedDate}
                        handleSelectDay={handleSelectDay}
                        displayDate={displayDate}
                        displayDateObj={displayDateObj}
                        selectedDayPickups={selectedDayPickups}
                        selectedDayReturns={selectedDayReturns}
                        setSelectedDate={setSelectedDate}
                        setSelectedOrder={setSelectedOrder}
                        setIsModalOpen={setIsModalOpen}
                        getOrderNumber={getOrderNumber}
                        getStatusDisplay={getStatusDisplay}
                        formatTime={formatTime}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        handleSort={handleSort}
                        sortOrders={sortOrders}
                        clearSort={() => {
                            setSortBy('time');
                            setSortOrder('asc');
                        }}
                        cars={cars}
                    />
                );
            })()}

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
                cars={cars}
            />
        </div>
    );
};

export default CalendarPage;
