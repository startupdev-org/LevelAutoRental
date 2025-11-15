import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    format,
    isSameMonth,
    addMonths,
    subMonths,
} from "date-fns";
import { cars } from "../../../data/cars";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, User, Calendar, Clock } from "lucide-react";
import { OrderDetailsModal } from "../../../components/modals/OrderDetailsModal";
import { OrderDisplay, fetchRentalsOnly } from "../../../lib/orders";

interface Props {
    viewMode: string | null;
}

export const CalendarPage: React.FC<Props> = () => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCar, setSelectedCar] = useState<any | null>(null);
    const [filters, setFilters] = useState({
        make: "",
        model: "",
    });
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState<OrderDisplay[]>([]);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Fetch orders with customer data
    useEffect(() => {
        const loadOrders = async () => {
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
    }, []);

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
            const carName = (car as any).name || '';
            const parts = carName.split(" ");
            const firstPart = parts[0];
            const make = firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
            const model = parts.slice(1).join(" ");
            if (!mapping[make]) mapping[make] = [];
            if (model && !mapping[make].includes(model)) mapping[make].push(model);
        });
        return mapping;
    }, []);

    const availableModels = useMemo(() => {
        if (!filters.make) return [];
        return makeToModels[filters.make] || [];
    }, [filters.make, makeToModels]);

    const uniqueMakes = useMemo(() => {
        const makes = cars.map((car) => {
            const carName = (car as any).name || '';
            const firstPart = carName.split(" ")[0];
            return firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
        });
        return [...new Set(makes)];
    }, []);

    const handleFilterChange = (key: "make" | "model", value: string) => {
        setFilters((prev) => {
            let newFilters = { ...prev, [key]: value };

            if (key === "make" && value) {
                const validModels = makeToModels[value] || [];
                if (prev.model && !validModels.includes(prev.model)) {
                    newFilters.model = "";
                } else newFilters.make = value
            } else if (key === "model" && value && newFilters.make) {
                const validModels = makeToModels[newFilters.make] || [];
                if (!validModels.includes(value)) {
                    newFilters.model = "";
                } else newFilters.model = value
            }

            if (newFilters.make !== "" && newFilters.model !== "") {
                const matchingCars = cars.filter((car) => {
                    const carName = (car as any).name || '';
                    const parts = carName.split(" ");
                    const make = parts[0].includes("-") ? parts[0].split("-")[0] : parts[0];
                    const model = parts.slice(1).join(" ");

                    const matchesMake = newFilters.make ? make === newFilters.make : true;
                    const matchesModel = newFilters.model ? model === newFilters.model : true;

                    return matchesMake && matchesModel;
                });

                setSelectedCar(matchingCars.length > 0 ? matchingCars[0] : null);
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
        const statusLower = status.toLowerCase();
        if (statusLower === 'paid') {
            return {
                text: 'To Deliver',
                className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
            };
        } else if (statusLower === 'pending') {
            return {
                text: 'Not Paid',
                className: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
            };
        } else {
            return {
                text: 'To Call',
                className: 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
            };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
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







    // Get order number function (same as in OrderTable)
    const getOrderNumber = useMemo(() => {
        // Sort orders by creation date (newest first) to match orders table
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return (order: OrderDisplay) => {
            const index = sortedOrders.findIndex(o => o.id === order.id);
            return index + 1;
        };
    }, [orders]);

    const eventsByDay = useMemo(() => {
        const pickupsMap = new Map<string, any[]>();
        const returnsMap = new Map<string, any[]>();

        // If no car selected, show all orders from all cars
        const filteredOrders = selectedCar 
            ? orders.filter((o) => o.carId.toString() === selectedCar.id.toString())
            : orders;

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
    }, [selectedCar, orders]);

    const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
    const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

    // Generate calendar days like in Cars page
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


    return (
        <div ref={calendarRef} className="max-w-[1200px] mx-auto">
            {/* Filter Toggle Button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all"
                >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>

            {/* Filters: Make + Model */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                {/* Make */}
                <div className="flex-1 relative dropdown-container">
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
                        Marca
                    </label>
                    <div
                                    className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer border border-white/10 ${filters.make ? "text-white" : "text-white/70"}`}
                        onClick={() => openDropdown("make")}
                    >
                        {filters.make || "Selectează marca"}
                    </div>
                    <AnimatePresence>
                        {showMakeDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50 min-w-[200px]"
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
                                {uniqueMakes.map((make) => (
                                    <div
                                        key={make}
                                                    className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white"
                                        onClick={() => {
                                            handleFilterChange("make", make);
                                            closeAllDropdowns();
                                        }}
                                    >
                                        {make}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Model */}
                <div className="flex-1 relative dropdown-container">
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
                        Model
                    </label>
                    <div
                                    className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer border border-white/10 ${!filters.make ? "text-white/50 cursor-not-allowed" : "text-white"
                            }`}
                        onClick={() => filters.make && openDropdown("model")}
                    >
                        {!filters.make ? "Selectează marca" : filters.model || "Orice"}
                    </div>
                    <AnimatePresence>
                        {showModelDropdown && filters.make && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50 min-w-[200px]"
                            >
                                <div
                                                className="px-4 py-2 cursor-pointer hover:bg-white/10 text-white"
                                    onClick={() => {
                                        handleFilterChange("model", "");
                                        closeAllDropdowns();
                                    }}
                                >
                                    Orice
                                </div>
                                {availableModels.map((model) => (
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
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                            {/* Clear Filter Button */}
                            {(filters.make || filters.model) && (
                                <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFilters({ make: "", model: "" });
                                setSelectedCar(null);
                            }}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all"
                        >
                            Clear
                        </button>
                                </div>
                            )}
                    </div>

                        {/* Selected car badge */}
                        {selectedCar && (
                            <div className="mt-4">
                                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium inline-block">
                                    Calendar for: {(selectedCar as any).name || 'Selected Car'}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

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
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                        <div key={day} className={`text-gray-400 font-medium ${i === 0 || i === 6 ? 'text-red-400' : ''}`}>
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
                        const dayEvents = [
                            ...(eventsByDay.pickups.get(dayString) || []),
                            ...(eventsByDay.returns.get(dayString) || [])
                        ];
                        const isInCurrentMonth = isSameMonth(dayDate, currentMonth);
                        const isSelected = selectedDate === dayString;
                        
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
                                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs rounded-xl transition-colors relative cursor-pointer ${
                                    !isInCurrentMonth ? 'text-gray-500' : 'text-white'
                                } ${dayClassName}`}
                                onClick={() => handleSelectDay(dayString)}
                                onMouseEnter={() => {
                                    if (dayEvents.length > 0) {
                                        setHoveredOrderId(dayEvents[0].id);
                                    }
                                }}
                                onMouseLeave={() => setHoveredOrderId(null)}
                            >
                                {dayDate.getDate()}
                                {/* Folded corner indicator for events */}
                                {hasEvents && (
                                    <div 
                                        className="absolute top-0 right-0"
                                        style={{
                                            width: '0',
                                            height: '0',
                                            borderStyle: 'solid',
                                            borderWidth: '0 10px 10px 0',
                                            borderColor: isPast 
                                                ? 'transparent #9ca3af transparent transparent' 
                                                : 'transparent #facc15 transparent transparent',
                                            borderTopRightRadius: '0.75rem',
                                            filter: 'drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.2))'
                                        }}
                                    ></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Event Tooltip (on hover) */}
                {hoveredOrderId && !selectedDate && (() => {
                    const order = orders.find(o => o.id.toString() === hoveredOrderId?.toString());
                    if (!order) return null;
                    const car = cars.find(c => c.id.toString() === order.carId.toString());
                    const carName = car ? ((car as any).name || 'Unknown Car') : 'Unknown Car';
                    return (
                <motion.div
                            initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 bg-white/10 border border-white/20 rounded-lg text-xs text-white"
                        >
                            <div className="font-semibold mb-2">Rental #{getOrderNumber(order).toString().padStart(4, '0')}</div>
                            <div className="text-gray-400 text-[10px] mb-3">{carName}</div>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 w-full">
                                    <div className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Pickup</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white">
                                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs font-bold">{formatTime(order.pickupTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                            <span className="text-xs font-medium">{formatDate(order.pickupDate)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 w-full">
                                    <div className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Return</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white">
                                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs font-bold">{formatTime(order.returnTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                            <span className="text-xs font-medium">{formatDate(order.returnDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
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
                                {displayDateObj.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                                {!selectedDate && <span className="ml-2 text-sm text-gray-400">(Today)</span>}
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
                                <h4 className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">Pickups ({selectedDayPickups.length})</h4>
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
                                                            <div className="text-gray-400 text-xs">Rental #{getOrderNumber(order).toString().padStart(4, '0')}</div>
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
                                                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-3 border border-white/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="text-gray-300 text-sm font-semibold mb-1">{carName}</div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                                <span className="text-white text-sm font-bold">{formatTime(order.pickupTime)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Pickup</div>
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
                                <h4 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Returns ({selectedDayReturns.length})</h4>
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
                                                            <div className="text-gray-400 text-xs">Rental #{getOrderNumber(order).toString().padStart(4, '0')}</div>
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
                                                <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="text-gray-300 text-sm font-semibold mb-1">{carName}</div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                                <span className="text-blue-300 text-sm font-bold">{formatTime(order.returnTime)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-blue-400/70 font-medium uppercase tracking-wide">Return</div>
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
            
            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
            />
        </div>
    );
};

export default CalendarPage;
