import { Calendar, CheckCircle, Clock } from "lucide-react";
import { Rental } from "../../../../lib/orders";

interface BasicInfoComponentProps {
    rentals?: Rental[] | null;
    t: (key: string) => string;
}

export default function BasicInfoComponent({ rentals, t }: BasicInfoComponentProps) {
    // Calculate counts
    const totalBookings = rentals?.length ?? 0;
    const finishedBookings = rentals?.filter(r => r.rental_status === "COMPLETED").length ?? 0;
    const activeBookings = rentals?.filter(r => r.rental_status === "ACTIVE").length ?? 0;

    const infoList = [
        {
            title: t("dashboard.overview.totalBookings") || "Total bookings",
            count: totalBookings,
            icon: <Calendar className="w-5 h-5 text-red-500" />,
        },
        {
            title: t("dashboard.overview.finishedBookings") || "Finished bookings",
            count: finishedBookings,
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        },
        {
            title: t("dashboard.overview.activeBookings") || "Active bookings",
            count: activeBookings,
            icon: <Clock className="w-5 h-5 text-yellow-500" />,
        },
    ];

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full">
            <h3 className="font-bold text-2xl sm:text-3xl text-white mb-2">Rentals Info</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4">{t('dashboard.overview.lifetimeBookings')}</p>

            <ul className="flex flex-col gap-4">
                {infoList.map((item, idx) => (
                    <li key={idx} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-3 border-b border-white/10 pb-2">
                        <div className="flex-shrink-0">{item.icon}</div>
                        <div className="flex justify-between w-full items-center">
                            <span className="text-gray-300 text-sm sm:text-base">{item.title}</span>
                            <span className="font-bold text-white text-lg sm:text-xl">{item.count}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
