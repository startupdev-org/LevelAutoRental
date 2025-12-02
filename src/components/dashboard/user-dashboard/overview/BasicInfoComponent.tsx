import { CheckCircle, Clock } from "lucide-react";
import { Rental } from "../../../../lib/orders";

interface BasicInfoComponentProps {
    rentals?: Rental[] | null;
    t: (key: string) => string;
}

export default function BasicInfoComponent({ rentals, t }: BasicInfoComponentProps) {
    // Calculate counts
    const activeBookings = rentals?.filter(r => r.rental_status === "ACTIVE" || r.rental_status === "CONTRACT").length ?? 0;

    // Calculate upcoming bookings (start_date is in the future)
    const now = new Date();
    const upcomingBookings = rentals?.filter(r => {
        const startDate = new Date(r.start_date);
        return startDate > now && r.rental_status !== "CANCELLED";
    }).length ?? 0;

    const stats = [
        {
            title: t("dashboard.overview.upcomingBookings") || "Upcoming bookings",
            count: upcomingBookings,
            description: t('dashboard.overview.upcomingDescription') || "Bookings starting soon",
            icon: CheckCircle,
        },
        {
            title: t("dashboard.overview.activeBookings") || "Active bookings",
            count: activeBookings,
            description: t('dashboard.overview.activeDescription') || "Currently active rentals",
            icon: Clock,
        },
    ];

    return (
        <>
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                // Hide the first card (upcoming bookings) on mobile
                const isHiddenOnMobile = idx === 0; // upcoming bookings is now the first card (index 0)

                return (
                    <div
                        key={idx}
                        className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 ${
                            isHiddenOnMobile ? 'hidden md:block' : ''
                        }`}
                    >
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
