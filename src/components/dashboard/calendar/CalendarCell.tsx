import React from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Props {
    day: Date;
    dayEvents: any[];
    inMonth: boolean;
    hoveredOrderId: string | null;
    setHoveredOrderId: (id: string | null) => void;
    viewMode: string | null;
    isInRange?: boolean;
    onSelect?: () => void;
}

export const CalendarCell: React.FC<Props> = ({
    day,
    dayEvents,
    inMonth,
    hoveredOrderId,
    setHoveredOrderId,
    viewMode,
    isInRange,
    onSelect
}) => {
    const dayDate = format(day, "yyyy-MM-dd");
    const isOrderDay = dayEvents.length > 0;
    const isAvailable = !isOrderDay;

    // Only allow selecting available days for users
    const handleSelect = () => {
        if (viewMode === "user" && isAvailable && onSelect) {
            onSelect();
        }
    };

    return (
        <motion.div
            layout
            animate={{
                backgroundColor: !inMonth
                    ? "#1f1f1f"
                    : dayEvents.length > 0
                        ? viewMode === "user"
                            ? "#af3e3eff" // red for borrowed
                            : "rgba(255,255,255,0.05)"
                        : viewMode === "user" && isInRange
                            ? "#57db88ff" // green for selected range
                            : "rgba(255,255,255,0.1)", // available
            }}
            className={`min-h-[110px] rounded-lg p-2 border relative transition-colors cursor-pointer`}
            onClick={handleSelect}  // user-only selection
            onMouseEnter={() => {
                if (viewMode === "user" && isAvailable) {
                    // console.log(`Available day hovered: ${dayDate}`);
                }
            }}
        >
            {/* Day Number */}
            <div className="flex items-start justify-between mb-2">
                <div className={`text-sm font-medium ${inMonth ? "text-white" : "text-gray-500"}`}>
                    {format(day, "d")}
                </div>
            </div>

            {/* Rent button for available user days */}
            {viewMode === "user" && isAvailable && (
                <motion.button
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white bg-green-500/80 rounded-md text-sm font-medium"
                    onClick={() => console.log(`Rent clicked for: ${dayDate}`)}
                    whileTap={{ scale: 0.95 }}
                >
                    Rent
                </motion.button>
            )}

            {/* Admin view */}
            {viewMode === "admin" && dayEvents.map((ev: any, i: number) => {
                const startDate = format(new Date(ev.pickupDate), "yyyy-MM-dd");
                const endDate = format(new Date(ev.returnDate), "yyyy-MM-dd");

                let borderRadius = "rounded-md";
                if (dayDate === startDate && dayDate === endDate) borderRadius = "rounded-md";
                else if (dayDate === startDate) borderRadius = "rounded-l-md";
                else if (dayDate === endDate) borderRadius = "rounded-r-md";
                else borderRadius = "rounded-none";

                const timeLabel =
                    dayDate === startDate
                        ? ev.pickupTime
                        : dayDate === endDate
                            ? ev.returnTime
                            : "";

                const isHoveredOrder = hoveredOrderId === ev.id;

                return (
                    <div
                        key={i}
                        className={`text-m truncate px-2 py-1 border ${borderRadius} ${isHoveredOrder
                            ? "bg-blue-400 border-blue-600"
                            : "bg-blue-200 border-blue-400"
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
        </motion.div>
    );
};
