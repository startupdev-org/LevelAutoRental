import React from "react";
import { format, isSameMonth, startOfDay } from "date-fns";

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

interface DayCellProps {
    day: Date;
    dayEvents: Order[];
    currentMonth: Date;
}

export const DayCell: React.FC<DayCellProps> = ({ day, dayEvents, currentMonth }) => {
    const dayKeyOf = (d: Date | string | null) => {
        if (!d) return "";
        return format(startOfDay(typeof d === "string" ? new Date(d) : d), "yyyy-MM-dd");
    };

    const statusColor = (status: string) =>
        status === "Paid"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : status === "Pending"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-red-100 text-red-700 border-red-200";

    const dayNumberColor = (dayEvents: Order[], inMonth: boolean) => {
        if (dayEvents.length === 0) return inMonth ? "text-white" : "text-gray-500";

        const status = dayEvents[0].status;
        switch (status) {
            case "Paid":
                return "text-green-700 font-bold";
            case "Pending":
                return "text-yellow-600 font-bold";
            case "Cancelled":
                return "text-red-600 font-bold";
            default:
                return "text-black font-bold";
        }
    };

    const inMonth = isSameMonth(day, currentMonth);

    // Determine day background
    let dayColorClass = "bg-white/3 border-white/10";
    if (dayEvents.length > 0) {
        dayColorClass = statusColor(dayEvents[0].status) + " border-opacity-40";
    }

    return (
        <div className={`min-h-[110px] rounded-lg p-2 border ${dayColorClass}`}>
            <div className={`text-sm ${dayNumberColor(dayEvents, inMonth)} mb-2`}>
                {format(day, "d")}
            </div>

            <div className="space-y-1 overflow-hidden">
                {dayEvents.map((ev, i) => {
                    const dayDate = dayKeyOf(day);
                    const startDate = dayKeyOf(ev.pickupDate);
                    const endDate = dayKeyOf(ev.returnDate);

                    let borderRadius = "rounded-md";
                    if (dayDate === startDate && dayDate === endDate) borderRadius = "rounded-md";
                    else if (dayDate === startDate) borderRadius = "rounded-l-md";
                    else if (dayDate === endDate) borderRadius = "rounded-r-md";
                    else borderRadius = "rounded-none";

                    let timeLabel = "";
                    if (dayDate === startDate) timeLabel = ev.pickupTime || "";
                    else if (dayDate === endDate) timeLabel = ev.returnTime || "";

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
