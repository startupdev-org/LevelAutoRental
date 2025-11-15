import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Car as CarIcon,
} from 'lucide-react';
import { Car, Car as CarType } from '../../../../types';

import { fetchCars, fetchImages, fetchMainImages } from "../../../../lib/db/cars";


// Cars Management View Component
export const CarsView: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCar, setEditingCar] = useState<CarType | null>(null);
    const [cars, setCars] = useState<CarType[]>([]);

    const [imageURL, setImageURL] = useState('');
    const [imagesURLs, setImagesURLs] = useState([]);
    const [mainImagesURLs, setMainImagesURLs] = useState<string[]>([]);


    async function handleFetchCars() {
        const cars = await fetchCars();
        setCars(cars);
    }

    async function handleFetchMainImages() {
        const mainImagesURLs = await fetchMainImages();
        // console.log('main images: ', mainImagesURLs)
        setMainImagesURLs(mainImagesURLs)
    }

    async function handelFetchImage() {
        const result = await fetchImages();
        // console.log('image URLs: ', result)
        // console.log('result.url: ', result.publicUrl)
        // setImageURL(result);
    }

    useEffect(() => {
        console.log('fetching data')
        handleFetchCars();
        handelFetchImage();
        handleFetchMainImages();
    }, []);

    const getCarStatus = (car: CarType): number => {
        if (car.status === 'available') return 0;
        else return 1; // Reserved
        return 0; // Available
    };


    // Filter and sort cars
    const filteredCars = useMemo(() => {
        let filtered = cars.filter(car => {
            // Safe search by make + model
            const carLabel = `${car.make ?? ""} ${car.model ?? ""}`.toLowerCase();
            const search = (searchQuery ?? "").toLowerCase();

            const matchesSearch = carLabel.includes(search);
            const matchesCategory =
                filterCategory === "all" ||
                (car.category ?? "") === filterCategory;

            return matchesSearch && matchesCategory;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === "price") {
                const diff = (a.price_per_day ?? 0) - (b.price_per_day ?? 0);
                return sortOrder === "asc" ? diff : -diff;
            } else if (sortBy === "year") {
                const diff = (a.year ?? 0) - (b.year ?? 0);
                return sortOrder === "asc" ? diff : -diff;
            } else if (sortBy === "status") {
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                const diff = statusA - statusB;
                return sortOrder === "asc" ? diff : -diff;
            } else {
                // Default: sort by status (status)
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                return statusA - statusB;
            }
        });

        return filtered;
    }, [cars, searchQuery, filterCategory, sortBy, sortOrder]);

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



    const handleEditCar = (car: CarType) => {
        setEditingCar(car);
        setSearchParams({ section: 'cars', carId: car.id.toString() });
    };
    // const handleSaveCar = (carData: Partial<CarType>): number | void => {
    //     if (editingCar) {
    //         // Update existing car - don't modify status, it's managed by the system
    //         const { status, ...dataToUpdate } = carData;
    //         setCars(prev => prev.map(c => c.id === editingCar.id ? { ...c, ...dataToUpdate } as CarType : c));
    //         setShowAddModal(false);
    //         setEditingCar(null);
    //         setSearchParams({ section: 'cars' });
    //     } else {
    //         // Add new car
    //         const newId = Math.max(...cars.map(c => c.id), 0) + 1;
    //         const newCar: CarType = {
    //             id: newId,
    //             name: carData.name || '',
    //             category: carData.category || 'luxury',
    //             image: carData.image || '',
    //             photoGallery: carData.photoGallery || [],
    //             pricePerDay: carData.pricePerDay || 0,
    //             year: carData.year || new Date().getFullYear(),
    //             seats: carData.seats || 5,
    //             transmission: carData.transmission || 'Automatic',
    //             body: carData.body || 'Sedan',
    //             fuelType: carData.fuelType || 'gasoline',
    //             drivetrain: carData.drivetrain || '',
    //             features: carData.features || [],
    //             rating: carData.rating || 0,
    //             reviews: carData.reviews || 0,
    //             status: 'Available', // Set to "Available" by default for new cars
    //             mileage: carData.mileage,
    //             fuelConsumption: carData.fuelConsumption,
    //             power: carData.power,
    //             acceleration: carData.acceleration,
    //             description: carData.description,
    //             longDescription: carData.longDescription,
    //         };
    //         setCars(prev => [...prev, newCar]);
    //         // Don't close modal or reset - let the modal handle the success state
    //         return newId;
    //     }
    // };

    // If carId is in URL, show car details/edit view
    if (carId) {
        const car = cars.find(c => c.id.toString() === carId);
        if (car) {
            return <CarDetailsEditView car={car} onCancel={() => setSearchParams({ section: 'cars' })} />;
        }
    }

    // Helper to get the image for a specific car
    function toKebabCase(str: string) {
        return str.trim().replace(/\s+/g, '-').toLowerCase();
    }


    function getCarImageMap(cars: Car[], mainImagesURLs: string[]): Record<string, string> {
        const map: Record<string, string> = {};

        cars.forEach(car => {
            const folderName = toKebabCase(`${car.make} ${car.model}`);
            const imageUrl = mainImagesURLs.find(url => url.includes(folderName)) || '/placeholder.jpg';
            map[folderName] = imageUrl;
        });

        return map;
    }

    const carImageMap = getCarImageMap(cars, mainImagesURLs);

    // console.log('car:url: ', getCarImageMap(cars, mainImagesURLs))



    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Cars Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex flex-col gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">All Cars</h2>
                            </div>
                        </div>
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
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>
                                <button
                                    onClick={() => handleSort('price')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'price'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Price
                                    {sortBy === 'price' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'price' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                                </button>
                                <button
                                    onClick={() => handleSort('year')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'year'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Year
                                    {sortBy === 'year' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'year' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                                </button>
                                <button
                                    onClick={() => handleSort('status')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'status'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Status
                                    {sortBy === 'status' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                                </button>
                                {sortBy && (
                                    <button
                                        onClick={() => {
                                            setSortBy(null);
                                            setSortOrder('asc');
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
                            {filteredCars.length > 0 ? (
                                filteredCars.map((car) => {
                                    return (
                                        <tr
                                            key={car.id}
                                            className="hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => handleEditCar(car)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">

                                                    <img
                                                        src={carImageMap[toKebabCase(`${car.make} ${car.model}`)]}
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
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl ${car.status
                                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                                        : car.status
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        }`}
                                                >
                                                    {car.status ? 'Rented' : car.status ? 'Reserved' : 'Available'}
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

            {/* Add/Edit Car Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CarFormModal
                        car={editingCar}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingCar(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Car Details/Edit View Component
interface CarDetailsEditViewProps {
    car: Car;
    onCancel: () => void;
}

const CarDetailsEditView: React.FC<CarDetailsEditViewProps> = ({ car, onCancel }) => {
    const [formData, setFormData] = useState<Partial<CarType>>(car);
    const [newFeature, setNewFeature] = useState('');
    const [newGalleryImage, setNewGalleryImage] = useState('');
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Car Name</label>
                            <input
                                type="text"
                                value={formData.make + formData.model || ''}
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
                                    value={formData.year || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Seats</label>
                                <input
                                    type="number"
                                    value={formData.seats || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <input
                                value={formData.category || 'luxury'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price Per Day (MDL)</label>
                            <input
                                type="number"
                                value={formData.price_per_day || ''}
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
                                value={formData.body || 'Sedan'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Transmission</label>
                            <input
                                value={formData.transmission || 'Automatic'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fuel Type</label>
                            <input
                                value={formData.fuel_type || 'gasoline'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Drivetrain</label>
                            <input
                                type="text"
                                value={formData.drivetrain || ''}
                                readOnly
                                placeholder="e.g., AWD, RWD, FWD"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Images</h3>

                    {/* <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Main Image</label>
                        {formData.image && (
                            <img src={formData.image} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded-lg border border-white/10" />
                        )}
                    </div> */}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Photo Gallery</label>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                    <div className="flex flex-wrap gap-2">
                        {formData.features?.map((feature, index) => (
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
                                value={formData.rating || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reviews Count</label>
                            <input
                                type="number"
                                value={formData.reviews || ''}
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
                        onClick={onCancel}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                    >
                        Exit
                    </button>
                </div>
            </form>
        </div>
    );
};

// Car Form Modal Component
interface CarFormModalProps {
    car: CarType | null;
    onClose: () => void;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ car, onClose }) => {
    const [, setSearchParams] = useSearchParams();
    const [formData, setFormData] = useState<Partial<CarType>>(
        car || {
            make: '',
            model: '',
            category: 'luxury',
            price_per_day: 0,
            year: new Date().getFullYear(),
            seats: 5,
        }
    );
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [carAdded, setCarAdded] = useState(false);
    const [newCarId, setNewCarId] = useState<number | null>(null);

    const handleContinue = () => {
        if (newCarId) {
            setSearchParams({ section: 'cars', carId: newCarId.toString() });
            onClose();
        }
    };

    // Placeholder function for uploading main image to Supabase
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            // TODO: Implement Supabase storage upload
            // const { data, error } = await supabase.storage
            //     .from('car-images')
            //     .upload(`main/${Date.now()}-${file.name}`, file);
            // if (error) throw error;
            // const { data: { publicUrl } } = supabase.storage
            //     .from('car-images')
            //     .getPublicUrl(data.path);
            // setFormData(prev => ({ ...prev, image: publicUrl }));

            // Temporary: Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image: objectUrl }));
            alert('Image upload will be implemented with Supabase storage');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingMainImage(false);
        }
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Add New Car</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Create a new vehicle entry in the fleet
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};