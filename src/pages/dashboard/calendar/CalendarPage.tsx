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
import { BorrowRequestDTO, Car } from "../../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, User, Clock, X } from "lucide-react";
import { CalendarPageDesktop } from "./CalendarPageDesktop";
import { useTranslation } from 'react-i18next';
import { fetchCarsModels } from "../../../lib/db/cars/cars-page/cars";
import { getMakeLogo, getBorrowRequestsStatusDisplay, getCarName } from "../../../utils/car/car";
import { formatTime } from "../../../utils/time";
import { fetchBorrowRequestForCalendarPage } from "../../../lib/db/requests/requests";

interface Props {
    viewMode: string | null;
}

export const CalendarPage: React.FC<Props> = () => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<BorrowRequestDTO | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState<BorrowRequestDTO[]>([]);
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

    const defaultFilters = {
        make: "",
        model: "",
    }
    const [filters, setFilters] = useState(defaultFilters);
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

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
                        const { mainImage } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                        };
                    })
                );

                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            }
        };
        loadCars();
    }, [showFilters]);

    useEffect(() => {
        console.log('fetching borrow requests');
        if (selectedCar) {
            console.log('fetching borrow requests for car:', selectedCar);
        }
        const loadOrders = async () => {
            try {
                const carId = selectedCar ? selectedCar.id : undefined;
                const data = await fetchBorrowRequestForCalendarPage(carId, currentMonth);
                setOrders(data);
            } catch (error) {
                console.error('Failed to load orders:', error);
            }
        };
        loadOrders();
    }, [filters, selectedCar, currentMonth]);

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

    // Get car make from car name
    const getCarMake = (carName: string): string => {
        const parts = carName.split(' ');
        const firstPart = parts[0];
        // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
        return firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
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
                const car = fetchCarsModels(filters.make);
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
            const pickupDate = format(new Date(o.start_date), "yyyy-MM-dd");
            if (!pickupsMap.has(pickupDate)) pickupsMap.set(pickupDate, []);
            pickupsMap.get(pickupDate)!.push(o);

            // Add order to its return date
            const returnDate = format(new Date(o.end_date), "yyyy-MM-dd");
            if (!returnsMap.has(returnDate)) returnsMap.set(returnDate, []);
            returnsMap.get(returnDate)!.push(o);
        });

        return { pickups: pickupsMap, returns: returnsMap };
    }, [filters, orders, cars]);

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

    const handleClearSort = () => {
        setFilters(defaultFilters);
        setSelectedCar(null)
        console.log("Sort cleared");
    };


    return (
        <div ref={calendarRef} className="max-w-[1600px] mx-auto px-0 sm:px6 lg:px-8">
            {/* Sort and Filter Row */}
            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                {/* Sort Controls */}
                <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-2 lg:gap-2">
                    {/* Desktop: Sortează după label */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
                                {/* Clear sort button */}
                                <button
                                    onClick={handleClearSort}
                                    className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
                                    title={t('admin.calendar.clearSort')}
                                >
                                    <X className="w-3 h-3" />
                                </button>

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
                                onClick={handleClearSort}
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
                                {currentMonth.toLocaleDateString(t('config.date'), { month: 'long', year: 'numeric' })}
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
                                    // Today + selected → red with white highlight
                                    dayClassName =
                                        'bg-red-500 text-white ring-2 ring-white/70 ring-offset-1 ring-offset-transparent font-semibold';
                                }
                                else if (isSelected) {
                                    // Selected (not today) → white highlight
                                    if (hasEvents) {
                                        if (isPast) {
                                            dayClassName =
                                                'bg-gray-500/40 text-white ring-2 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold hover:bg-gray-500/50';
                                        } else {
                                            dayClassName =
                                                'bg-yellow-500/20 text-white ring-2 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold hover:bg-yellow-500/30';
                                        }
                                    } else {
                                        dayClassName =
                                            'bg-white/10 text-white ring-2 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold';
                                    }
                                }
                                else if (isToday) {
                                    // Today (not selected)
                                    dayClassName = 'bg-red-500 text-white';
                                }
                                else if (hasEvents) {
                                    // Events (not selected)
                                    if (isPast) {
                                        dayClassName = 'bg-gray-500/40 text-white hover:bg-gray-500/50';
                                    } else {
                                        dayClassName = 'bg-yellow-500/20 text-white hover:bg-yellow-500/30';
                                    }
                                }
                                else {
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

                        const selectedDayPickups = eventsByDay.pickups.get(displayDate) || [];
                        const selectedDayReturns = eventsByDay.returns.get(displayDate) || [];

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
                                                const car = order.car;
                                                const carName = car !== null ? getCarName(car) : '';

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
                                                                        <div className="font-semibold text-white text-sm">{order.customer_email}</div>
                                                                        <div className="text-gray-400 text-xs">{t('admin.calendar.rental')} #{order.id.toString().padStart(4, '0')}</div>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const statusDisplay = getBorrowRequestsStatusDisplay(order.status);
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
                                                                    <span className="text-yellow-400 text-lg font-bold tracking-tight">{formatTime(order.start_time)}</span>
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
                                                const car = order.car;
                                                const carName = car !== null ? getCarName(car) : '';

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
                                                                        <div className="font-semibold text-white text-sm">{order.customer_email}</div>
                                                                        <div className="text-gray-400 text-xs">{t('admin.calendar.rental')} #{(order.id).toString().padStart(4, '0')}</div>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const statusDisplay = getBorrowRequestsStatusDisplay(order.status);
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
                                                                    <span className="text-blue-400 text-lg font-bold tracking-tight">{formatTime(order.end_time)}</span>
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
                        selectedCar={selectedCar}
                        setSelectedOrder={setSelectedOrder}
                        setIsModalOpen={setIsModalOpen}
                        formatTime={formatTime}
                    />
                );
            })()}
        </div>
    );
};

export default CalendarPage;
