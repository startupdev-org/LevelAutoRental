import React from "react";
import { format, isSameMonth } from "date-fns";
import { DayCell } from "./DayCell";

interface Order {
    id: string | number;
    customer: string;
    status: string;
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
    carId?: string | number;
}

interface CalendarGridProps {
    monthMatrix: Date[][];
    eventsByDay: Map<string, Order[]>;
    currentMonth: Date;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ monthMatrix, eventsByDay, currentMonth }) => {
    return (
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
                        const dayKey = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDay.get(dayKey) || [];
                        return (
                            <DayCell
                                key={`${wi}-${dayKey}`}
                                day={day}
                                dayEvents={dayEvents}
                                currentMonth={currentMonth}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
