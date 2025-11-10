import React from "react";
import { format, isSameMonth } from "date-fns";

interface CalendarCellProps {
    day: Date;
    events: any[];
    currentMonth: Date;
}

export const DayCell: React.FC<CalendarCellProps> = ({ day, events, currentMonth }) => {
    const inMonth = isSameMonth(day, currentMonth);

    const statusColor = (status: string) =>
        status === "Paid"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : status === "Pending"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-red-100 text-red-700 border-red-200";

    const dayNumberColor = (dayEvents: any[]) => {
        if (dayEvents.length === 0) return inMonth ? "text-white" : "text-gray-500";
        const status = dayEvents[0].status;
        switch (status) {
            case "Paid": return "text-green-700 font-bold";
            case "Pending": return "text-yellow-600 font-bold";
            case "Cancelled": return "text-red-600 font-bold";
            default: return "text-black font-bold";
        }
    };

    const dayKeyOf = (d: Date) => format(d, "yyyy-MM-dd");

    return (
        <div className={`min-h-[110px] rounded-lg p-2 border ${events.length > 0 ? statusColor(events[0].status) + " border-opacity-40" : "bg-white/3 border-white/10"}`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`text-sm ${dayNumberColor(dayEvents, inMonth)}`}>
                    {format(day, "d")}
                </div>
            </div>

            <div className="space-y-1 overflow-hidden mt-1">
                {events.map((ev, i) => {
                    const dayDate = dayKeyOf(day);
                    const startDate = dayKeyOf(new Date(ev.pickupDate));
                    const endDate = dayKeyOf(new Date(ev.returnDate));

                    let borderRadius = "rounded-md";
                    if (dayDate === startDate && dayDate === endDate) borderRadius = "rounded-md";
                    else if (dayDate === startDate) borderRadius = "rounded-l-md";
                    else if (dayDate === endDate) borderRadius = "rounded-r-md";
                    else borderRadius = "rounded-none";

                    let timeLabel = "";
                    if (dayDate === startDate) timeLabel = ev.pickupTime;
                    else if (dayDate === endDate) timeLabel = ev.returnTime;

                    return (
                        <div
                            key={i}
                            className={`text-m truncate px-2 py-1 border ${statusColor(ev.status)} border-opacity-40 bg-opacity-30 ${borderRadius}`}
                            title={`${ev.customer}${timeLabel ? ` • ${timeLabel}` : ""}`}
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
