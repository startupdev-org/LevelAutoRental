import React from "react";
import { DayCell } from "./DayCell";
import { format, isSameMonth, startOfDay } from "date-fns";

interface CalendarGridProps {
    monthMatrix: Date[][];
    eventsByDay: Map<string, any[]>;
    currentMonth: Date;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ monthMatrix, eventsByDay, currentMonth }) => {
    const dayKeyOf = (d: Date | string | null) => {
        try {
            if (!d) return "";
            const dt = typeof d === "string" ? new Date(d) : d;
            return format(startOfDay(dt), "yyyy-MM-dd");
        } catch {
            return "";
        }
    };

    const statusColor = (status: string) =>
        status === "Paid"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : status === "Pending"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-red-100 text-red-700 border-red-200";

    return (
        <div className="grid grid-cols-7 gap-3">
            {monthMatrix.map((week, wi) =>
                week.map((day) => {
                    const dayKey = dayKeyOf(day);
                    const dayEvents = eventsByDay.get(dayKey) || [];
                    const inMonth = isSameMonth(day, currentMonth);

                    // Determine day color based on orders
                    let dayColorClass = "bg-white/3 border-white/10"; // default
                    if (dayEvents.length > 0) {
                        // If multiple orders, just take the first one's status for coloring
                        const status = dayEvents[0].status;
                        dayColorClass = statusColor(status) + " border-opacity-40";
                    }
                    return (
                        <DayCell
                            key={`${wi}-${dayKey}`}
                            day={day}
                            events={dayEvents}
                            currentMonth={currentMonth}
                        />
                    );
                })
            )}
        </div>
    );
};
