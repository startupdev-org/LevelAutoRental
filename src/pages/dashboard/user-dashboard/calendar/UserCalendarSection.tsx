import React, { useState, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import { BorrowRequestDTO, Car } from "../../../../types";
import { getBorrowRequestsStatusDisplay } from "../../../../utils/car/car";

interface UserCalendarSectionProps {
    month: Date;
    setMonth: React.Dispatch<React.SetStateAction<Date>>;
    orders: BorrowRequestDTO[];
    t: (key: string) => string;
    car: Car | null;
    onCarChange: (car: Car | null) => void;
}

export const UserCalendarSection: React.FC<UserCalendarSectionProps> = ({ orders, month, setMonth, t, car, onCarChange }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<BorrowRequestDTO | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const nextMonth = () => setMonth(prev => addMonths(prev, 1));
    const prevMonth = () => setMonth(prev => subMonths(prev, 1));


    const handleSelectDay = (day: string) => {
        setSelectedDate(day);
    };

    const getOrderNumber = (order: BorrowRequestDTO) => order.id;

    const generateCalendarDays = (month: Date): string[] => {
        const startMonth = startOfMonth(month);
        const endMonth = endOfMonth(month);
        const startDate = startOfWeek(startMonth, { weekStartsOn: 1 });
        const endDate = endOfWeek(endMonth, { weekStartsOn: 1 });

        const days: string[] = [];
        let date = startDate;
        while (date <= endDate) {
            days.push(format(date, "yyyy-MM-dd"));
            date = addDays(date, 1);
        }
        return days;
    };

    // Prepare sets for all pickup/return dates
    const eventsByDay = useMemo(() => {
        const pickups = new Set<string>();
        const returns = new Set<string>();

        orders.forEach(o => {
            if (o.start_date) pickups.add(format(new Date(o.start_date), "yyyy-MM-dd"));
            if (o.end_date) returns.add(format(new Date(o.end_date), "yyyy-MM-dd"));
        });

        return { pickups, returns };
    }, [orders]);

    // Determine all dates to highlight when a day is selected
    const relatedDates = useMemo(() => {
        if (!selectedDate) return new Set<string>();
        const related = new Set<string>();

        orders.forEach(o => {
            const start = o.start_date ? format(new Date(o.start_date), "yyyy-MM-dd") : null;
            const end = o.end_date ? format(new Date(o.end_date), "yyyy-MM-dd") : null;

            if (start === selectedDate || end === selectedDate) {
                if (start) related.add(start);
                if (end) related.add(end);
            }
        });

        return related;
    }, [selectedDate, orders]);

    const displayDateObj = selectedDate ? new Date(selectedDate) : new Date();

    const sortedPickups = useMemo(() => {
        if (!selectedDate) return [];
        return orders
            .filter(o => o.start_date && format(new Date(o.start_date), "yyyy-MM-dd") === selectedDate)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }, [selectedDate, orders]);

    const sortedReturns = useMemo(() => {
        if (!selectedDate) return [];
        return orders
            .filter(o => o.end_date && format(new Date(o.end_date), "yyyy-MM-dd") === selectedDate)
            .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    }, [selectedDate, orders]);

    const renderOrderCard = (order: BorrowRequestDTO, isPickup: boolean) => {
        if (!order || !order.car) return null;

        const carName = `${order.car.make} ${order.car.model}`;
        const colorClass = isPickup ? "text-yellow-400" : "text-blue-4  00";
        const statusDisplay = getBorrowRequestsStatusDisplay(order.status);

        return (
            <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                className="p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
            >
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs">
                                    {t("admin.calendar.rental")} #{getOrderNumber(order).toString().padStart(4, "0")}
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className} flex-shrink-0`}>
                            {statusDisplay.text}
                        </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/90 text-sm truncate">{carName}</span>
                        <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${colorClass}/70 flex-shrink-0`} />
                            <span className={`${colorClass} text-lg font-bold tracking-tight`}>
                                {isPickup ? order.start_time?.slice(0, 5) : order.end_time?.slice(0, 5)}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="grid grid-cols-[380px,1fr] gap-8">
            {/* Calendar */}
            <div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">◀</button>
                        <div className="text-sm font-medium text-white">{month.toLocaleDateString(t('config.date'), { month: "long", year: "numeric" })}</div>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">▶</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((d, i) =>
                            <div key={d} className={`text-gray-400 font-medium ${i >= 5 ? 'text-red-400' : ''}`}>{d}</div>
                        )}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays(month).map((day, idx) => {
                            const dayDate = new Date(day);
                            const hasPickups = eventsByDay.pickups.has(day);
                            const hasReturns = eventsByDay.returns.has(day);
                            const hasEvents = hasPickups || hasReturns;
                            const isInCurrentMonth = isSameMonth(dayDate, month);
                            const today = new Date(); today.setHours(0, 0, 0, 0);
                            const isToday = isSameDay(dayDate, today);
                            const isPast = dayDate < today;
                            const isSelected = selectedDate === day;
                            const isRelated = relatedDates.has(day);

                            let dayClass = '';

                            if (isToday && isSelected)
                                dayClass = 'bg-red-500 text-white ring-2 ring-white/70 font-semibold';
                            else if (isToday)
                                dayClass = 'bg-red-500 text-white';
                            else if (isSelected)
                                dayClass = 'bg-white/20 text-white ring-2 ring-white font-semibold';
                            else if (isRelated)
                                dayClass = 'bg-blue-500/20 text-white ring-1 ring-white/40 font-semibold';
                            else if (hasEvents)
                                dayClass = isPast
                                    ? 'bg-gray-500/40 text-white'
                                    : 'bg-yellow-500/20 text-white';
                            else
                                dayClass = 'hover:bg-white/10';


                            return (
                                <div
                                    key={idx}
                                    className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl transition-colors relative cursor-pointer ${!isInCurrentMonth ? 'text-gray-500' : 'text-white'} ${dayClass}`}
                                    onClick={() => handleSelectDay(day)}
                                >
                                    {dayDate.getDate()}
                                    {hasEvents && (
                                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isToday ? 'bg-yellow-500' : isPast ? 'bg-gray-500' : 'bg-red-500'}`}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Selected Car Info */}
                {car && (
                    <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300">
                        {/* Professional Close Button */}
                        <button
                            onClick={() => onCarChange(null)}
                            aria-label="Close"
                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 shadow-lg transition-transform duration-200 transform hover:scale-110"
                        >
                            <span className="text-lg font-bold select-none">x</span>
                        </button>

                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-3">Calendar for selected car</h3>
                                <p className="text-m"><span className="font-semibold text-white">Make:</span> {car.make}</p>
                                <p className="text-m"><span className="font-semibold text-white">Model:</span> {car.model}</p>
                                <p className="text-m"><span className="font-semibold text-white">Year:</span> {car.year}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <img src={car.image_url || ''} alt="Car" className="w-32 h-32 rounded-lg object-cover bg-black/10" />
                            </div>
                        </div>
                    </div>
                )}


                {/* Pickups & Returns */}
                <div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">
                                {displayDateObj.toLocaleDateString(t('config.date'), {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                {!selectedDate && <span className="ml-2 text-sm text-gray-400">({t("admin.calendar.today")})</span>}
                            </h3>
                            {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white transition-colors p-1">✕</button>}
                        </div>

                        {/* Pickups */}
                        {sortedPickups.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-base font-semibold text-yellow-300 mb-4 uppercase tracking-wide">{t("admin.calendar.pickups")} ({sortedPickups.length})</h4>
                                <div className="space-y-4">{sortedPickups.map(o => renderOrderCard(o, true))}</div>
                            </div>
                        )}

                        {/* Returns */}
                        {sortedReturns.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">{t("admin.calendar.returns")} ({sortedReturns.length})</h4>
                                <div className="space-y-4">{sortedReturns.map(o => renderOrderCard(o, false))}</div>
                            </div>
                        )}

                        {/* Empty */}
                        {sortedPickups.length === 0 && sortedReturns.length === 0 && (
                            <div className="text-center py-8 text-gray-400 font-semibold text-m">No deals for this day</div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div >
    );
};

