import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";
import { CalendarFilters } from "./CalendarFilter";
import { useTranslation } from "react-i18next";
import { CalendarSection } from "./CalendarSection";
import { fetchRentalsCalendarPage } from "../../../../lib/db/rentals/rentals";
import { Rental } from "../../../../lib/orders";

export const CalendarPage: React.FC = () => {
    const { t } = useTranslation();

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<{ carId: string; searchQuery: string }>({
        carId: '',
        searchQuery: ''
    });

    const [month, setMonth] = useState(new Date());

    const [carId, setCarId] = useState<number | null>(null);

    const [orders, setOrders] = useState<Rental[] | null>([])

    useEffect(() => {
        hadleFetchUserRentals();
    }, [carId, month]);

    async function hadleFetchUserRentals() {
        const orders = await fetchRentalsCalendarPage(
            (carId)?.toString(),
            month,
        );

        setOrders(orders)

        console.log('the orders for the calendar page are: ', orders)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Car Calendar</h2>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-s font-medium rounded-lg border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
                >
                    <Filter className="w-4 h-4" />
                    <span>{showFilters ? t('admin.calendar.hideFilters') : t('admin.calendar.showFilters')}</span>
                </button>
            </div>

            {/* Filters Sidebar */}
            {showFilters && createPortal(
                <CalendarFilters
                    setShowFilters={setShowFilters}
                    filters={filters}
                    setFilters={setFilters}
                />,
                document.body
            )}

            {/* Calendar Section */}
            {orders && (
                <CalendarSection
                    orders={orders}
                    month={month}
                    setMonth={setMonth}
                    t={t}
                />
            )}
        </div>

    );
};

export default CalendarPage;
