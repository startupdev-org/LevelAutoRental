import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, ArrowRight, CarIcon } from "lucide-react";
import { Car } from "../../../../types";
import { fetchCarsPaginated } from "../../../../lib/db/cars/cars";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { LoadingState } from "../../../../components/ui/LoadingState";

interface FiltersProps {
    setShowFilters: (val: boolean) => void;
    filters: {
        make?: string;
        carId?: string;
        searchQuery?: string;
    };
    setFilters: (filters: any) => void;
    setCar: (car: Car | null) => void;
}

export const CalendarFilters: React.FC<FiltersProps> = ({
    setShowFilters,
    filters,
    setFilters,
    setCar
}) => {
    // 
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [total, setTotal] = useState(0);
    const totalPages = Math.ceil(total / pageSize);

    const [cars, setCars] = useState<Car[]>([]);

    const [debouncedSearch, setDebouncedSearch] = useState(filters.searchQuery || "");
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.searchQuery || "");
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.searchQuery]);

    // Fetch cars whenever page or debouncedSearch changes
    useEffect(() => {
        async function loadAll() {
            setLoading(true);
            const { cars, total } = await fetchCarsPaginated(page, pageSize, debouncedSearch);
            setCars(cars);
            setTotal(total);
            setLoading(false);
        }
        loadAll();
    }, [page, debouncedSearch]);

    const handleFilterChange = (field: string, value: string) => {
        setFilters({ ...filters, [field]: value });
        if (field === "carId")
            setShowFilters(false);
    };

    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    function clearFilters() {
        handleFilterChange("searchQuery", "")
    }

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-[9998]"
                onClick={() => setShowFilters(false)}
            />

            {/* Sidebar */}
            <motion.div
                key="calendar-sidebar"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-96 max-w-[90vw] bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl z-[9999] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Filters</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search cars..."
                            value={filters.searchQuery || ""}
                            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                            className="w-full pl-12 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                        />
                        {filters.searchQuery && (
                            <button
                                onClick={clearFilters}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>


                    {/* Cars List */}
                    <div className="flex flex-col gap-3 min-h-[200px]">
                        {loading ? (
                            <LoadingState message="Se încarcă mașinile..." />
                        ) : cars && cars.length > 0 ? (
                            cars.map((car, index) => (
                                <div
                                    key={car.id ? `car-${car.id}` : `car-fallback-${index}`}
                                    onClick={() => {
                                        handleFilterChange("carId", car.id?.toString() || "")
                                        setCar(car)
                                    }}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-white/20 cursor-pointer hover:bg-white/10 transition-colors ${filters.carId === car.id.toString() ? "bg-red-500/20" : ""}`}
                                >
                                    <div className="w-16 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-700/30 flex items-center justify-center">
                                        {car.image_url ? (
                                            <img src={car.image_url} alt={car.make} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-white/50 text-xs">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-white font-medium text-sm">{car.make} {car.model}</span>
                                        <span className="text-gray-300 text-xs">{car.year || "Unknown Year"}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon={<CarIcon className="w-8 h-8 text-gray-400" />}
                                title="No cars found"
                                subtitle="Try adjusting your filters"
                                buttonText="Clear Filters"
                                onButtonClick={clearFilters}
                            />
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && !loading && (
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={() => goToPage(page - 1)}
                                disabled={page === 1}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-sm text-gray-300">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => goToPage(page + 1)}
                                disabled={page === totalPages}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
