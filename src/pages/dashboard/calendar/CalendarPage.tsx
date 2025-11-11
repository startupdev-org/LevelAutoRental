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
import { getMonthFromDate } from "../../../utils/date";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CalendarGrid } from "../../../components/dashboard/calendar/CalendarGrid";

interface Props {
    viewMode: string | null;
}

export const CalendarPage: React.FC<Props> = ({ viewMode }) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [carName, setCarName] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCar, setSelectedCar] = useState<any | null>(null);

    const [selectedDay, setSelectedDay] = useState<string | null>(null); // track selected day

    const [rangeStart, setRangeStart] = useState<string | null>(null);
    const [rangeEnd, setRangeEnd] = useState<string | null>(null);



    const [filters, setFilters] = useState({
        make: "",
        model: "",
    });
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);


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

    const handleSelectDay = (day: string) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            // Start a new range
            setRangeStart(day);
            setRangeEnd(null);
        } else if (rangeStart && !rangeEnd) {
            // Complete the range
            if (day < rangeStart) {
                setRangeEnd(rangeStart);
                setRangeStart(day);
            } else {
                setRangeEnd(day);
            }
        }
    };


    const handleFilterChange = (key: "make" | "model", value: string) => {
        setFilters((prev) => {
            let newFilters = { ...prev, [key]: value };

            // 1. Validate make
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

            // 3. Find first car matching the filters
            // console.log('the filters are: ', newFilters)
            if (newFilters.make !== "" && newFilters.model !== "") {
                const matchingCars = cars.filter((car) => {
                    const parts = car.name.split(" ");
                    const make = parts[0].includes("-") ? parts[0].split("-")[0] : parts[0];
                    const model = parts.slice(1).join(" ");

                    const matchesMake = newFilters.make ? make === newFilters.make : true;
                    const matchesModel = newFilters.model ? model === newFilters.model : true;

                    return matchesMake && matchesModel;
                });

                setSelectedCar(matchingCars.length > 0 ? matchingCars[0] : null);
            } else setSelectedCar(null)

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

    const eventsByDay = useMemo(() => {
        const map = new Map<string, any[]>();
        // console.log('the slected car is: ', selectedCar)
        if (!selectedCar) return map; // if no car selected, show nothing

        const filteredOrders = orders.filter((o) => o.carId.toString() === selectedCar.id.toString());

        filteredOrders.forEach((o) => {
            const start = new Date(o.pickupDate);
            const end = new Date(o.returnDate);
            let day = startOfDay(start);
            const lastDay = startOfDay(end);

            while (day <= lastDay) {
                const key = format(day, "yyyy-MM-dd");
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(o);
                day = addDays(day, 1);
            }
        });

        console.log('Orders for slected car: ', map)

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

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Filters: Make + Model + Month */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Make */}
                <div className="flex-1 relative dropdown-container">
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
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
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
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
                {/* Month */}
                <div className="flex-1 relative dropdown-container">
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest text-white/80">
                        Perioada
                    </label>
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 w-full">
                        <button
                            onClick={prevMonth}
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="px-3 text-sm text-gray-200 font-medium">{getMonthFromDate(currentMonth)}</div>
                        <button
                            onClick={nextMonth}
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
                        >
                            <ArrowRight size={16} />
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
                            setFilters({ make: "", model: "" });
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
            <CalendarGrid
                monthMatrix={monthMatrix}
                eventsByDay={eventsByDay}
                currentMonth={currentMonth}
                hoveredOrderId={hoveredOrderId}
                setHoveredOrderId={setHoveredOrderId}
                viewMode={viewMode}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onSelectDay={handleSelectDay}
            />


        </div>
    );
};

export default CalendarPage;
