import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Car as CarIcon,
} from 'lucide-react';
import { Car, CarFilterOptions, Car as CarType } from '../../../../types';
import { fetchCarsWithMainImageFilteredPaginated } from '../../../../lib/db/cars/cars-page/cars';
import { fetchCarWithImagesById } from '../../../../lib/db/cars/cars';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { CarDetailsView } from '../../../../components/dashboard/user-dashboard/cars/CarDetailsView';
import { EmptyState } from '../../../../components/ui/EmptyState';


// Cars Management View Component
export const CarsView: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewingCar, setViewingCarDetails] = useState<Car | null>(null);
    const [cars, setCars] = useState<CarType[]>([]);

    const [status, setStatus] = useState<'available' | 'borrowed' | null>(null);

    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [page, setPage] = useState(1);
    const pageSize = 5;

    const [totalCars, setTotalCars] = useState(0);

    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce effect: updates debouncedSearchQuery after 500ms of inactivity
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1); // reset to first page whenever search changes
        }, 500); // adjust debounce time here

        return () => clearTimeout(handler); // cleanup if user types again
    }, [searchQuery]);


    // Clear filters immediately
    function clearFilters() {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setSortBy(null);
        setSortOrder('asc');
        setStatus(null);
        setPage(1);
    }

    async function handleFetchCarsWithSortByFilters() {
        setLoading(true); // start loading
        try {
            const filters = getCurrentFilters();
            const { cars, total } = await fetchCarsWithMainImageFilteredPaginated(filters);
            setCars(cars);
            setTotalCars(total);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false); // stop loading
        }
    }

    // Fetch cars whenever debouncedSearchQuery changes
    useEffect(() => {
        handleFetchCarsWithSortByFilters();
    }, [debouncedSearchQuery, sortBy, sortOrder, status, page]);

    // Reset page to 1 whenever the searchQuery changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery, status, sortBy, sortOrder]);


    useEffect(() => {
        handleFetchCarsWithSortByFilters();
    }, [sortBy, sortOrder, searchQuery, status, page]);


    const handleSort = (field: 'price' | 'year' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getCurrentFilters = (): CarFilterOptions => {
        return {
            searchQuery: searchQuery.trim(),
            sortBy,
            sortOrder,
            status,
            page,
            pageSize
        };
    };


    const handleViewCarDetails = async (car: CarType) => {
        try {
            // Fetch full details including images
            const fullCar = await fetchCarWithImagesById(car.id.toString());
            setViewingCarDetails(fullCar);

            // Update URL
            setSearchParams({ section: 'cars', carId: car.id.toString() });
        } catch (error) {
            console.error('Error fetching car details:', error);
        }
    };

    // If a car is selected for viewing, show the details view
    if (viewingCar) {
        return (
            <CarDetailsView
                car={viewingCar}
                onCancel={() => setViewingCarDetails(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">All Cars</h2>
            </div>

            {/* Cars Table Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-8">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex flex-col gap-4">
                        {/* Search + Filters Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                            {/* Search Input */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search cars..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Sort + Status */}
                            <div className="flex flex-wrap items-center gap-2">

                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Sort by:
                                </span>

                                {/* PRICE + YEAR sorting */}
                                {["price", "year"].map((field) => {
                                    const isActive = sortBy === field;
                                    const arrowColor = isActive
                                        ? sortOrder === "asc"
                                            ? "text-green-400"
                                            : "text-red-400"
                                        : "opacity-50 text-gray-400";

                                    return (
                                        <button
                                            key={field}
                                            onClick={() => handleSort(field as "price" | "year")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isActive
                                                ? "bg-white/10 border-white/20"
                                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-gray-300"
                                                }`}
                                        >
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                            {isActive ? (
                                                sortOrder === "asc" ? (
                                                    <ArrowUp className={`w-3 h-3 ${arrowColor}`} />
                                                ) : (
                                                    <ArrowDown className={`w-3 h-3 ${arrowColor}`} />
                                                )
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-50" />
                                            )}
                                        </button>
                                    );
                                })}

                                {/* STATUS FILTER */}
                                <button
                                    onClick={() =>
                                        setStatus((prev) =>
                                            prev === null ? "available" : prev === "available" ? "borrowed" : null
                                        )
                                    }
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${status === "available"
                                        ? "bg-green-500/20 text-green-300 border-green-500/50"
                                        : status === "borrowed"
                                            ? "bg-red-500/20 text-red-300 border-red-500/50"
                                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {status === "available"
                                        ? "Available"
                                        : status === "borrowed"
                                            ? "Borrowed"
                                            : "Status"}
                                </button>

                                {/* CLEAR FILTERS */}
                                {(sortBy || status || searchQuery) && (
                                    <button
                                        onClick={() => { clearFilters }}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                {loading ? (
                    <LoadingState message='Loading cars' />
                ) : (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Car
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Transmission
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('price')}
                                                className="flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                                Price/Day
                                                {sortBy === 'price' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('year')}
                                                className="flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                                Year
                                                {sortBy === 'year' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('status')}
                                                className="flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                                Status
                                                {sortBy === 'status' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {cars.length > 0 ? (
                                        cars.map((car) => {
                                            return (
                                                <tr
                                                    key={car.id}
                                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                                    onClick={() => handleViewCarDetails(car)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">

                                                            <img
                                                                src={car.image_url || ''}
                                                                alt={`${car.make}-${car.model}`.toLowerCase()}

                                                                className="w-12 h-12 object-cover rounded-md border border-white/10"
                                                            />
                                                            <div>
                                                                <p className="text-white font-semibold">{car.make} {car.model}</p>
                                                                <p className="text-gray-400 text-xs">{car.body} · {car.seats} seats</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 text-xs font-semibold bg-white/10 text-gray-300 rounded capitalize">
                                                            {car.transmission}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-white font-semibold">{car.price_per_day} MDL</td>
                                                    <td className="px-6 py-4 text-gray-300">{car.year}</td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl ${car.status === 'borrowed'
                                                                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                                                : car.status === 'MAINTENANCE'
                                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' // AVAILABLE
                                                                }
                                                    `}
                                                        >
                                                            {car.status === 'borrowed'
                                                                ? 'Borrowed'
                                                                : car.status === 'maintenance'
                                                                    ? 'Maintenance'
                                                                    : 'Available'}
                                                        </span>

                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5}>
                                                <EmptyState
                                                    icon={<CarIcon className="w-8 h-8 text-gray-400" />}
                                                    title="No cars found"
                                                    subtitle="Try adjusting your filters"
                                                    buttonText="Clear Filters"
                                                    onButtonClick={clearFilters}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalCars > pageSize && (
                                <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
                                    <span className="text-gray-400 text-sm">
                                        Page {page} of {Math.ceil(totalCars / pageSize)}
                                    </span>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                            className={`px-3 py-1 rounded text-xs font-semibold ${page === 1
                                                ? "bg-white/10 text-gray-400 cursor-not-allowed"
                                                : "bg-white/5 text-white hover:bg-white/10"
                                                }`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage((prev) => (prev * pageSize < totalCars ? prev + 1 : prev))}
                                            disabled={page * pageSize >= totalCars}
                                            className={`px-3 py-1 rounded text-xs font-semibold ${page * pageSize >= totalCars
                                                ? "bg-white/10 text-gray-400 cursor-not-allowed"
                                                : "bg-white/5 text-white hover:bg-white/10"
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};