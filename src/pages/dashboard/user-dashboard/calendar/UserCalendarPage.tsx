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
        <div className="max-w-[1600px] mx-auto px-0 sm:px6 lg:px-8">
            {/* Filter Button */}
            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-3 lg:gap-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
                >
                    <Filter className="w-3 h-3" />
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
