import React, { useState, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import { Rental } from "../../../../lib/orders";

interface CalendarSectionProps {
    month: Date;
    setMonth: React.Dispatch<React.SetStateAction<Date>>;
    orders: Rental[];
    t: (key: string) => string;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ orders, month, setMonth, t }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Rental | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const prevMonth = () => setMonth(subMonths(month, 1));
    const nextMonth = () => setMonth(addMonths(month, 1));
    const handleSelectDay = (day: string) => setSelectedDate(day);

    const formatTime = (time: string | undefined) => {
        if (!time) return "--:--";
        const d = new Date(time);
        return isNaN(d.getTime()) ? "--:--" : format(d, "HH:mm");
    };

    const getOrderNumber = (order: Rental) => order.id;
    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "pending": return { text: "Pending", className: "bg-yellow-500/30 text-yellow-300" };
            case "active": return { text: "Active", className: "bg-green-500/30 text-green-300" };
            case "completed": return { text: "Completed", className: "bg-blue-500/30 text-blue-300" };
            case "canceled": return { text: "Canceled", className: "bg-red-500/30 text-red-300" };
            default: return { text: status, className: "bg-gray-500/30 text-gray-300" };
        }
    };

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

    console.log('orders: ', orders)

    // Compute pickups/returns for selected day
    const selectedDayPickups = useMemo(() => {
        if (!selectedDate) return [];
        return orders.filter(o => format(new Date(o.start_time), "yyyy-MM-dd") === selectedDate);
    }, [selectedDate, orders]);

    const selectedDayReturns = useMemo(() => {
        if (!selectedDate) return [];
        return orders.filter(o => format(new Date(o.end_time), "yyyy-MM-dd") === selectedDate);
    }, [selectedDate, orders]);

    // Compute eventsByDay to mark calendar
    const eventsByDay = useMemo(() => {
        const pickups = new Set<string>();
        const returns = new Set<string>();

        orders.forEach(o => {
            if (o.start_date) {
                const startDate = new Date(o.start_date);
                if (!isNaN(startDate.getTime())) {
                    pickups.add(format(startDate, "yyyy-MM-dd"));
                }
            }

            if (o.end_date) {
                const endDate = new Date(o.end_date);
                if (!isNaN(endDate.getTime())) {
                    returns.add(format(endDate, "yyyy-MM-dd"));
                }
            }
        });


        return { pickups, returns };
    }, [orders]);

    // console.log('events by day: ', eventsByDay)

    const displayDateObj = selectedDate ? new Date(selectedDate) : new Date();

    const sortedPickups = selectedDayPickups.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const sortedReturns = selectedDayReturns.sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());

    const renderOrderCard = (order: Rental, isPickup: boolean) => {
        if (!order || !order.car) return null;

        const carName = order.car.make + " " + order.car.model;
        const colorClass = isPickup ? "text-yellow-400" : "text-blue-400";
        const statusDisplay = getStatusDisplay(order.rental_status);

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
                                {isPickup ? formatTime(order.start_time) : formatTime(order.end_time)}
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
                        <div className="text-sm font-medium text-white">{month.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}</div>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">▶</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((d, i) => <div key={d} className={`text-gray-400 font-medium ${i >= 5 ? 'text-red-400' : ''}`}>{d}</div>)}
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
                            const isSelected = selectedDate === day || (!selectedDate && isToday);

                            let dayClass = '';
                            if (isToday && isSelected) dayClass = 'bg-red-500 text-white ring-1 ring-white/60 font-semibold';
                            else if (isToday) dayClass = 'bg-red-500 text-white';
                            else if (isSelected) dayClass = hasEvents ? (isPast ? 'bg-gray-500/40 text-white ring-1 font-semibold' : 'bg-yellow-500/20 text-white ring-1 font-semibold') : 'bg-white/5 ring-1 text-white font-semibold';
                            else if (hasEvents) dayClass = isPast ? 'bg-gray-500/40 text-white' : 'bg-yellow-500/20 text-white';
                            else dayClass = 'hover:bg-white/10';

                            return (
                                <div key={idx} className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl transition-colors relative cursor-pointer ${!isInCurrentMonth ? 'text-gray-500' : 'text-white'} ${dayClass}`} onClick={() => handleSelectDay(day)}>
                                    {dayDate.getDate()}
                                    {hasEvents && <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isToday ? 'bg-yellow-500' : isPast ? 'bg-gray-500' : 'bg-red-500'}`}></div>}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Pickups & Returns */}
            <div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">{displayDateObj.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {!selectedDate && <span className="ml-2 text-sm text-gray-400">({t("admin.calendar.today")})</span>}
                        </h3>
                        {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white transition-colors p-1">✕</button>}
                    </div>

                    {/* Pickups */}
                    {sortedPickups.length > 0 && <div className="mb-6">
                        <h4 className="text-base font-semibold text-yellow-300 mb-4 uppercase tracking-wide">{t("admin.calendar.pickups")} ({sortedPickups.length})</h4>
                        <div className="space-y-4">{sortedPickups.map(o => renderOrderCard(o, true))}</div>
                    </div>}

                    {/* Returns */}
                    {sortedReturns.length > 0 && <div className="mb-6">
                        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">{t("admin.calendar.returns")} ({sortedReturns.length})</h4>
                        <div className="space-y-4">{sortedReturns.map(o => renderOrderCard(o, false))}</div>
                    </div>}

                    {/* Empty */}
                    {sortedPickups.length === 0 && sortedReturns.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No bookings for this day</div>}
                </motion.div>
            </div>
        </div>
    )
}
