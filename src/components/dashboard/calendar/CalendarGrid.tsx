import React from "react";
import { isSameMonth, format, startOfDay } from "date-fns";
import { CalendarCell } from "./CalendarCell";

interface Props {
    monthMatrix: Date[][];
    eventsByDay: Map<string, any[]>;
    currentMonth: Date;
    hoveredOrderId: string | null;
    setHoveredOrderId: (id: string | null) => void;
}

export const CalendarGrid: React.FC<Props> = ({ monthMatrix, eventsByDay, currentMonth, hoveredOrderId, setHoveredOrderId }) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6">

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
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
