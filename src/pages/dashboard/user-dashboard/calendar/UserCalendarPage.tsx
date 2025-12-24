import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";
import { CalendarFilters } from "./CalendarFilter";
import { useTranslation } from "react-i18next";
import { UserCalendarSection } from "./UserCalendarSection";
import { BorrowRequestDTO, Car } from "../../../../types";
import { LoadingState } from "../../../../components/ui/LoadingState";
import { fetchBorrowRequestForUserCalendarPage } from "../../../../lib/db/requests/requests";

export const CalendarPage: React.FC = () => {
    const { t } = useTranslation();

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<{ carId: string; searchQuery: string }>({
        carId: '',
        searchQuery: ''
    });

    const [car, setCar] = useState<Car | null>(null);
    const [month, setMonth] = useState<Date>(new Date());

    const [orders, setOrders] = useState<BorrowRequestDTO[]>([])

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAll() {
            setLoading(true);

            await Promise.all([
                hadleFetchUserRentals()
            ])
            setLoading(false);
        }
        loadAll();
    }, [filters, month]);

    async function hadleFetchUserRentals() {
        const orders = await fetchBorrowRequestForUserCalendarPage(
            (filters.carId)?.toString(),
            month,
        );
        setOrders(orders)
    }

    const handleSetCar = (car: Car | null) => {
        setCar(car);
        setFilters(prev => ({
            ...prev,
            carId: car?.id ?? ''
        }));
    };


    if (loading && !showFilters) {
        return (
            <LoadingState
                message="Se încarcă calendarul mașinilor..."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl sm:text-5xl font-bold text-white mb-6 mt-4">Car Calendar</h2>
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
                    setCar={handleSetCar}
                />,
                document.body
            )}

            {/* Calendar Section */}
            {orders && (
                <UserCalendarSection
                    orders={orders}
                    month={month}
                    setMonth={setMonth}
                    t={t}
                    car={car}
                    onCarChange={handleSetCar}

                />
            )}
        </div>
    );
};

export default CalendarPage;
