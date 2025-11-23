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

    const stats = [
        {
            title: t("dashboard.overview.totalBookings") || "Total bookings",
            count: totalBookings,
            description: t('dashboard.overview.lifetimeBookings'),
            icon: Calendar,
        },
        {
            title: t("dashboard.overview.finishedBookings") || "Finished bookings",
            count: finishedBookings,
            description: t('dashboard.overview.lifetimeBookings'),
            icon: CheckCircle,
        },
        {
            title: t("dashboard.overview.activeBookings") || "Active bookings",
            count: activeBookings,
            description: t('dashboard.overview.lifetimeBookings'),
            icon: Clock,
        },
    ];

    return (
        <>
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div key={idx} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon className="text-red-600" size={24} />
                            <h3 className="font-semibold text-white">{stat.title}</h3>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stat.count}</p>
                        <p className="text-gray-400 text-sm">{stat.description}</p>
                    </div>
                );
            })}
        </>
    );
}
