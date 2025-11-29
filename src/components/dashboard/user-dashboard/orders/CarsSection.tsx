import React, { useState, useEffect } from "react";
import { Loader2, CarIcon, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Car } from "../../../../types";
import { fetchCarsPaginated } from "../../../../lib/db/cars/cars";
import { EmptyState } from "../../../ui/EmptyState";

interface CarsFilterListProps {
    setCar: (car: Car | null) => void;
}

export const CarsFilterList: React.FC<CarsFilterListProps> = ({ setCar }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [cars, setCars] = useState<Car[] | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const totalPages = Math.ceil(total / pageSize);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch cars
    useEffect(() => {
        async function loadCars() {
            setLoading(true);
            const { cars, total } = await fetchCarsPaginated(page, pageSize, debouncedSearch);
            setCars(cars);
            setTotal(total);
            setLoading(false);
        }
        loadCars();
    }, [page, debouncedSearch]);

    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    const clearSearch = () => setSearchQuery("");

    return (
        <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search cars..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Cars List */}
            <div className="flex flex-col gap-3 min-h-[200px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                        <p className="mt-2 text-sm text-gray-400">Loading cars...</p>
                    </div>
                ) : cars && cars.length > 0 ? (
                    cars.map((car, index) => (
                        <div
                            key={car.id ?? `car-fallback-${index}`}
                            onClick={() => setCar(car)}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
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
                        subtitle="Try adjusting your search"
                        buttonText="Clear Search"
                        onButtonClick={clearSearch}
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
    );
};
