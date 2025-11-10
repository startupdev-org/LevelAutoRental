import React, { useMemo, useState, useEffect } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfDay,
} from "date-fns";
import { orders } from "../../../data/index";
import { cars } from "../../../data/cars";
import { AnimatePresence, motion } from "framer-motion";
import { getCurrentFormattedDate, getCurrentMonth } from "../../../utils/date";

export const CalendarPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [carName, setCarName] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCar, setSelectedCar] = useState<any | null>(null);

    const [filters, setFilters] = useState({
        make: "",
        model: "",
    });
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const makeToModels = useMemo(() => {
        const mapping: Record<string, string[]> = {};
        cars.forEach((car) => {
            const parts = car.name.split(" ");
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
            const firstPart = car.name.split(" ")[0];
            return firstPart.includes("-") ? firstPart.split("-")[0] : firstPart;
        });
        return [...new Set(makes)];
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value };

            if (key === "make") {
                const newMake = value;
                if (newMake && prev.model) {
                    const validModels = makeToModels[newMake] || [];
                    const currentModelValid = validModels.some(
                        (model) => model.toLowerCase() === prev.model.toLowerCase()
                    );
                    if (!currentModelValid) newFilters.model = "";
                } else if (!newMake) newFilters.model = "";
            }

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

    const dayKeyOf = (d: Date | string | null) => {
        try {
            if (!d) return "";
            const dt = typeof d === "string" ? new Date(d) : d;
            return format(startOfDay(dt), "yyyy-MM-dd");
        } catch {
            return "";
        }
    };

    const orderMatchesCar = (o: any, c: any | null) => {
        if (!c) return true;
        return o.carId?.toString() === c.id?.toString();
    };

    const eventsByDay = useMemo(() => {
        const map = new Map<string, any[]>();
        orders.forEach((o) => {
            if (!orderMatchesCar(o, selectedCar)) return;
            const key = dayKeyOf(o.pickupDate);
            if (!key) return;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(o);
        });
        return map;
    }, [selectedCar]);

    const monthMatrix = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows: Date[][] = [];
        let day = startDate;
        while (day <= endDate) {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(day);
                day = addDays(day, 1);
            }
            rows.push(week);
        }
        return rows;
    }, [currentMonth]);

    const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
    const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

    const statusColor = (status: string) =>
        status === "Paid"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : status === "Pending"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-red-100 text-red-700 border-red-200";

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Filters: Make + Model */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Make */}
                <div className="flex-1 relative dropdown-container">
                    <label className="text-[11px] font-semibold mb-2 block uppercase tracking-widest text-white/80">
                        Marca
                    </label>
                    <div
                        className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer ${filters.make ? "text-white" : "text-white/70"}`}
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
                                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-50 min-w-[200px]"
                            >
                                <div
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
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
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
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
                    <label className="text-[11px] font-semibold mb-2 block uppercase tracking-widest text-white/80">
                        Model
                    </label>
                    <div
                        className={`px-3 py-2 rounded-md bg-white/5 cursor-pointer ${!filters.make ? "text-white/50 cursor-not-allowed" : "text-white"
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
                                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-50 min-w-[200px]"
                            >
                                <div
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
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
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
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

                {/* Month */}
                <div className="flex-1 relative dropdown-container">
                    <label className="text-[11px] font-semibold mb-2 block uppercase tracking-widest text-white/80">
                        Perioada
                    </label>
                    {/* Month navigation */}
                    <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-lg p-2 ml-3">
                        <button
                            onClick={prevMonth}
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
                        >
                            ←
                        </button>
                        <div className="px-3 text-sm text-gray-200 font-medium">{getCurrentMonth()}</div>
                        <button
                            onClick={nextMonth}
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
                        >
                            →
                        </button>
                    </div>
                </div>

            </div>

            {/* Selected car badge */}
            {selectedCar && (
                <div className="mb-4 flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-white/5 text-white text-sm font-medium">
                        Calendar for: {selectedCar.name}
                    </div>
                    <button
                        onClick={() => {
                            setSelectedCar(null);
                            setCarName("");
                        }}
                        className="text-sm text-gray-300 hover:text-white"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-2 text-xs sm:text-sm text-gray-400 mb-3">
                    {["Lun", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"].map((d) => (
                        <div key={d} className="text-center font-medium">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-3">
                    {monthMatrix.map((week, wi) =>
                        week.map((day) => {
                            const dayKey = dayKeyOf(day);
                            const dayEvents = eventsByDay.get(dayKey) || [];
                            const inMonth = isSameMonth(day, currentMonth);
                            return (
                                <div
                                    key={`${wi}-${dayKey}`}
                                    className={`min-h-[110px] rounded-lg p-2 border ${inMonth ? "border-white/10" : "border-transparent"
                                        } bg-white/3`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div
                                            className={`text-sm font-medium ${isSameDay(day, new Date()) ? "text-purple-300" : inMonth ? "text-white" : "text-gray-500"
                                                }`}
                                        >
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                    <div className="space-y-2 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((ev: any, i: number) => (
                                            <div
                                                key={i}
                                                className={`text-xs truncate px-2 py-1 rounded-md border ${statusColor(ev.status)} border-opacity-40`}
                                                title={`${ev.customer} • ${ev.amount}`}
                                            >
                                                <div className="font-semibold">{ev.customer}</div>
                                                <div className="text-[11px] text-gray-600">{ev.pickupTime} - {ev.returnTime}</div>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && <div className="text-xs text-gray-300 mt-1">+{dayEvents.length - 3} more...</div>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
