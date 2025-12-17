import React from "react";
import { isSameMonth } from "date-fns";
import { BorrowRequestDTO, Car } from "../../../types";
import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getCarName, getBorrowRequestsStatusDisplay } from "../../../utils/car/car";

interface CalendarPageDesktopProps {
    currentMonth: Date;
    prevMonth: () => void;
    nextMonth: () => void;
    generateCalendarDays: (date: Date) => (string | null)[];
    eventsByDay: { pickups: Map<string, any[]>; returns: Map<string, any[]> };
    selectedDate: string | null;
    handleSelectDay: (day: string) => void;
    displayDate: string;
    displayDateObj: Date;
    selectedDayPickups: BorrowRequestDTO[];
    selectedDayReturns: BorrowRequestDTO[];
    setSelectedDate: (date: string | null) => void;
    selectedCar: Car | null;
    setSelectedOrder: (order: BorrowRequestDTO | null) => void;
    setIsModalOpen: (open: boolean) => void;
    formatTime: (timeString: string) => string;
}

export const CalendarPageDesktop: React.FC<CalendarPageDesktopProps> = ({
    currentMonth,
    prevMonth,
    nextMonth,
    generateCalendarDays,
    eventsByDay,
    selectedDate,
    handleSelectDay,
    displayDateObj,
    selectedDayPickups,
    selectedDayReturns,
    setSelectedDate,
    setSelectedOrder,
    setIsModalOpen,
    formatTime,
}) => {
    const { t } = useTranslation();
    const sortedPickups = selectedDayPickups;
    const sortedReturns = selectedDayReturns;

    return (
        <div className="grid grid-cols-[380px,1fr] gap-8">
            {/* Left Column: Calendar */}
            <div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4"
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
                                dayClassName = 'bg-red-500 text-white ring-1 ring-white/60 ring-offset-1 ring-offset-transparent font-semibold';
                            } else if (isToday) {
                                dayClassName = 'bg-red-500 text-white';
                            } else if (isSelected) {
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
                                    className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl transition-colors relative cursor-pointer ${!isInCurrentMonth ? 'text-gray-500' : 'text-white'
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
            </div>

            {/* Right Column: Rentals */}
            <div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-0"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">
                            {displayDateObj.toLocaleDateString(t('config.date'), {
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
                    {sortedPickups.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-base font-semibold text-yellow-300 mb-4 uppercase tracking-wide">{t('admin.calendar.pickups')} ({sortedPickups.length})</h4>
                            <div className="space-y-4">
                                {sortedPickups.map((order) => {
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
                                            className="p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
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
                    {sortedReturns.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">{t('admin.calendar.returns')} ({sortedReturns.length})</h4>
                            <div className="space-y-4">
                                {sortedReturns.map((order) => {
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
                                            className="p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
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

                    {sortedPickups.length === 0 && sortedReturns.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            No bookings for this day
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};