import React from "react";
import { isSameMonth, format, startOfDay } from "date-fns";
import { CalendarCell } from "./CalendarCell";

interface Props {
    monthMatrix: Date[][];
    eventsByDay: Map<string, any[]>;
    currentMonth: Date;
    hoveredOrderId: string | null;
    setHoveredOrderId: (id: string | null) => void;
    viewMode: string | null;
    rangeStart: string | null;
    rangeEnd: string | null;
    onSelectDay: (day: string) => void;
}

export const CalendarGrid: React.FC<Props> = ({
    monthMatrix,
    eventsByDay,
    currentMonth,
    hoveredOrderId,
    setHoveredOrderId,
    viewMode,
    rangeStart,
    rangeEnd,
    onSelectDay,
}) => {
    const isInRange = (dayKey: string, start: string | null, end: string | null) => {
        if (!start) return false;
        if (!end) return dayKey === start;
        return dayKey >= start && dayKey <= end;
    };

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6 space-y-3">

            {/* Weekday Header */}
            <div className="bg-white/10 rounded-lg py-2">
                <div className="grid grid-cols-7 gap-3 text-xs sm:text-sm text-gray-300 text-center font-semibold uppercase tracking-wide">
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            className={`${i >= 5 ? "text-red-400" : "text-gray-300"
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-3">
                {monthMatrix.map((week, wi) =>
                    week.map(day => {
                        const dayKey = format(startOfDay(day), "yyyy-MM-dd");
                        const dayEvents = eventsByDay.get(dayKey) || [];
                        const inMonth = isSameMonth(day, currentMonth);

                        return (
                            <CalendarCell
                                key={`${wi}-${dayKey}`}
                                day={day}
                                dayEvents={dayEvents}
                                inMonth={inMonth}
                                hoveredOrderId={hoveredOrderId}
                                setHoveredOrderId={setHoveredOrderId}
                                viewMode={viewMode}
                                isInRange={isInRange(dayKey, rangeStart, rangeEnd)}
                                onSelect={() => onSelectDay(dayKey)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
