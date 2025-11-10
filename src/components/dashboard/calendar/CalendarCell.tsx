import React from "react";
import { format } from "date-fns";

interface Props {
    day: Date;
    dayEvents: any[];
    inMonth: boolean;
    hoveredOrderId: string | null;
    setHoveredOrderId: (id: string | null) => void;
}

export const CalendarCell: React.FC<Props> = ({
    day,
    dayEvents,
    inMonth,
    hoveredOrderId,
    setHoveredOrderId
}) => {
    const dayDate = format(day, "yyyy-MM-dd");

    // Determine if the day belongs to any order
    const isOrderDay = dayEvents.length > 0;

    return (
        <div
            className={`min-h-[110px] rounded-lg p-2 border relative ${!inMonth
                ? "bg-gray-900 text-gray-500 border-gray-700"
                : isOrderDay
                    ? "bg-white/5 border-white/10" // subtle highlight for order days
                    : "bg-white/3 border-white/10"
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`text-sm ${inMonth ? "text-white" : "text-gray-500"}`}>
                    {format(day, "d")}
                </div>
            </div>

            <div className="space-y-1 overflow-hidden relative">
                {dayEvents.map((ev: any, i: number) => {
                    const startDate = format(new Date(ev.pickupDate), "yyyy-MM-dd");
                    const endDate = format(new Date(ev.returnDate), "yyyy-MM-dd");

                    let borderRadius = "rounded-md";
                    if (dayDate === startDate && dayDate === endDate) borderRadius = "rounded-md";
                    else if (dayDate === startDate) borderRadius = "rounded-l-md";
                    else if (dayDate === endDate) borderRadius = "rounded-r-md";
                    else borderRadius = "rounded-none";

                    const timeLabel =
                        dayDate === startDate ? ev.pickupTime : dayDate === endDate ? ev.returnTime : "";

                    // Is this the hovered order?
                    const isHoveredOrder = hoveredOrderId === ev.id;

                    return (
                        <div
                            key={i}
                            className={`text-m truncate px-2 py-1 border ${borderRadius} ${isHoveredOrder
                                ? "bg-blue-400 border-blue-600" // stronger highlight on hover
                                : "bg-blue-200 border-blue-400" // default subtle highlight
                                }`}
                            title={`${ev.customer}${timeLabel ? ` • ${timeLabel}` : ""}`}
                            onMouseEnter={() => setHoveredOrderId(ev.id)}
                            onMouseLeave={() => setHoveredOrderId(null)}
                        >
                            <div>{ev.customer}</div>
                            {timeLabel && <div className="text-[10px] text-black">{timeLabel}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
