import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Car as CarIcon,
} from 'lucide-react';
import { Car, CarFilterOptions, Car as CarType } from '../../../../types';
import { fetchCarsWithMainImageFiltered, fetchCarsWithPhotos } from '../../../../lib/db/cars/cars-page/cars';
import { fetchCarWithImagesById } from '../../../../lib/db/cars/cars';


// Cars Management View Component
export const CarsView: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewingCar, setViewingCarDetails] = useState<Car | null>(null);
    const [cars, setCars] = useState<CarType[]>([]);

    const [status, setStatus] = useState<'available' | 'borrowed' | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');




    async function handleFetchCars() {
        const cars = await fetchCarsWithPhotos();
        setCars(cars);
    }

    async function handleFetchCarsWithSortByFilters() {
        const filters = getCurrentFilters();
        console.log('fetching info with current filters: ', filters)

        const cars = await fetchCarsWithMainImageFiltered(filters);
        setCars(cars);
    }

    useEffect(() => {
        console.log('fetching data')
        handleFetchCars();
    }, []);

    useEffect(() => {
        handleFetchCarsWithSortByFilters();
    }, [filterCategory, sortBy, sortOrder, searchQuery, status]);


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
            status
        };
    };


    async function handleFetchCarInfo(carId: string) {
        return await fetchCarWithImagesById(carId);

    }

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
                        {/* Search and Sort Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Search */}
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
                            {/* Sort Controls */}
                            {/* Sort + Status Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>

                                {/* Price & Year buttons */}
                                {['price', 'year'].map((field) => {
                                    const isActive = sortBy === field;
                                    const arrowColor = isActive
                                        ? sortOrder === 'asc'
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        : 'opacity-50 text-gray-400';

                                    return (
                                        <button
                                            key={field}
                                            onClick={() => handleSort(field as 'price' | 'year')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isActive
                                                ? 'bg-white/10 border-white/20'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-gray-300'
                                                }`}
                                        >
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                            {isActive ? (
                                                sortOrder === 'asc' ? <ArrowUp className={`w-3 h-3 ${arrowColor}`} /> : <ArrowDown className={`w-3 h-3 ${arrowColor}`} />
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-50" />
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Status button */}
                                <button
                                    onClick={() => {
                                        // Toggle through three states: null -> available -> borrowed -> null
                                        setStatus((prev) => {
                                            if (prev === null) return 'available';
                                            if (prev === 'available') return 'borrowed';
                                            return null;
                                        });
                                        handleFetchCars(); // fetch with new status filter
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${status === 'available'
                                        ? 'bg-green-500/20 text-green-300 border-green-500/50'
                                        : status === 'borrowed'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {/* Show current value or default */}
                                    {status === 'available'
                                        ? 'Available'
                                        : status === 'borrowed'
                                            ? 'Borrowed'
                                            : 'Status'}

                                    {/* Arrow indicators */}
                                    {/* {status === 'available' && <span className="ml-1 text-green-400 text-xs">↑</span>}
                                    {status === 'borrowed' && <span className="ml-1 text-red-400 text-xs">↓</span>}
                                    {status === null && <span className="ml-1 text-gray-400 text-xs">–</span>} */}
                                </button>


                                {/* Clear Sort */}
                                {(sortBy || status) && (
                                    <button
                                        onClick={() => {
                                            setSortBy(null);
                                            setSortOrder('asc');
                                            setStatus(null);
                                            handleFetchCars();
                                        }}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                    >
                                        Clear Sort
                                    </button>
                                )}
                            </div>



                        </div>
                    </div>
                </div>

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
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        {searchQuery || filterCategory !== 'all' ? 'No cars found matching your filters' : 'No cars available'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Car Details/Edit View Component
interface CarDetailsViewProps {
    car: Car;
    onCancel: () => void;
}

const CarDetailsView: React.FC<CarDetailsViewProps> = ({ car, onCancel: onExit }) => {

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const mainImage = selectedIndex !== null
        ? car.photo_gallery?.[selectedIndex]   // optional chaining înainte de index
        : car.photo_gallery?.[0];




    return (
        <div className="space-y-6">
            <form className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Car Name</label>
                            <input
                                type="text"
                                value={(car.make || '') + ' ' + (car.model || '')}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                <input
                                    type="number"
                                    value={car.year || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Seats</label>
                                <input
                                    type="number"
                                    value={car.seats || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <input
                                value={car.category || 'luxury'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price Per Day (MDL)</label>
                            <input
                                type="number"
                                value={car.price_per_day || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Body Type</label>
                            <input
                                value={car.body || 'Sedan'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Transmission</label>
                            <input
                                value={car.transmission || 'Automatic'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fuel Type</label>
                            <input
                                value={car.fuel_type || 'gasoline'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Drivetrain</label>
                            <input
                                type="text"
                                value={car.drivetrain || ''}
                                readOnly
                                placeholder="e.g., AWD, RWD, FWD"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                {mainImage && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Photo Gallery</label>

                        {/* Preview mare */}
                        <div className="w-full flex justify-center mb-4">
                            <img
                                src={mainImage}
                                srcSet={`${mainImage}?w=320 320w, ${mainImage}?w=640 640w, ${mainImage}?w=800 800w`}
                                sizes="(max-width: 768px) 320px, (max-width: 1024px) 480px, 640px"
                                alt="Selected car image"
                                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-lg border border-white/20"
                            />
                        </div>

                        {/* Gallery mică */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {car.photo_gallery && car.photo_gallery.length > 0 && car.photo_gallery.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    srcSet={`${url}?w=160 160w, ${url}?w=320 320w, ${url}?w=480 480w`}
                                    sizes="(max-width: 768px) 64px, (max-width: 1024px) 96px, 120px"
                                    alt={`Gallery image ${index + 1}`}
                                    className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-cover rounded-lg border 
                    ${selectedIndex === index ? "border-blue-500 ring-2 ring-blue-400" : "border-white/10"}`}
                                    onClick={() => setSelectedIndex(index)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                    <div className="flex flex-wrap gap-2">
                        {car.features?.map((feature, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Status & Ratings */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Status & Ratings</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={car.rating || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reviews Count</label>
                            <input
                                type="number"
                                value={car.reviews || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={onExit}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                    >
                        Exit
                    </button>
                </div>
            </form >
        </div >
    );
};