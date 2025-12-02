import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
} from 'lucide-react';
import { LuPencil } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { fetchCars, createCar, updateCar } from '../../../../lib/cars';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';
import { Car as CarType } from '../../../../types';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { CarDetailsEditView } from './CarDetailsEditView';
import { CarFormModal } from '../modals/CarFormModal';

export const CarsView: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCar, setEditingCar] = useState<CarType | null>(null);
    const [localCars, setLocalCars] = useState<CarType[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingCarId, setTogglingCarId] = useState<number | null>(null);
    const [pendingStatus, setPendingStatus] = useState<Map<number, string>>(new Map());
    const [carsWithActiveRentals, setCarsWithActiveRentals] = useState<Set<number>>(new Set());
    const { showSuccess, showError } = useNotification();

    // Fetch cars from Supabase and load images from storage
    useEffect(() => {
        const loadCars = async () => {
            try {
                setLoading(true);
                const fetchedCars = await fetchCars();
                
                // Fetch active rentals to check which cars are currently rented
                try {
                    const { supabase } = await import('../../../../lib/supabase');
                    const { data: activeRentals } = await supabase
                        .from('Rentals')
                        .select('car_id')
                        .eq('rental_status', 'ACTIVE');
                    
                    if (activeRentals) {
                        const carIdsWithActiveRentals = new Set(
                            activeRentals.map(r => typeof r.car_id === 'number' ? r.car_id : parseInt(r.car_id.toString(), 10))
                        );
                        setCarsWithActiveRentals(carIdsWithActiveRentals);
                    }
                } catch (error) {
                    console.error('Error fetching active rentals:', error);
                }
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        console.log(`[Admin] Loading images for car: "${carName}" (make: "${car.make}", model: "${car.model}", id: ${car.id})`);
                        if (carName.toLowerCase().includes('q7') || car.model?.toLowerCase().includes('q7')) {
                            console.log(`[Admin] Q7 car detected:`, { car, carName });
                        }

                        try {
                            const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                            console.log(`[Admin] Images for "${carName}": main=${!!mainImage}, gallery=${photoGallery.length}`);
                            const result = {
                                ...car,
                                image_url: mainImage || car.image_url,
                                photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                            };
                            if (carName.toLowerCase().includes('q7')) {
                                console.log(`[Admin] Q7 result:`, {
                                    original_image_url: car.image_url,
                                    original_photo_gallery: car.photo_gallery,
                                    final_image_url: result.image_url,
                                    final_photo_gallery: result.photo_gallery,
                                    mainImage_found: !!mainImage,
                                    photoGallery_length: photoGallery.length
                                });
                            }
                            return result;
                        } catch (error) {
                            console.warn(`[Admin] Failed to fetch images for car "${carName}":`, error);
                            // Fall back to database URLs if image fetching fails
                            console.log(`[Admin] Using fallback URLs for "${carName}": main=${car.image_url}, gallery=${car.photo_gallery?.length || 0}`);
                            const result = {
                                ...car,
                                image_url: car.image_url,
                                photo_gallery: car.photo_gallery,
                            };
                            if (carName.toLowerCase().includes('q7')) {
                                console.log(`[Admin] Q7 fallback result:`, result);
                            }
                            return result;
                        }
                    })
                );
                console.log(`[Admin] Setting ${carsWithImages.length} cars to state`);
                const q7Car = carsWithImages.find(c => (c as any).name?.toLowerCase().includes('q7') || c.model?.toLowerCase().includes('q7'));
                if (q7Car) {
                    console.log(`[Admin] Q7 car in final result:`, {
                        id: q7Car.id,
                        name: (q7Car as any).name,
                        make: q7Car.make,
                        model: q7Car.model,
                        image_url: q7Car.image_url,
                        photo_gallery: q7Car.photo_gallery
                    });
                }
                setLocalCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCars();
    }, []);

    // Get car status for sorting (based on database status field and active rentals)
    const getCarStatus = (car: CarType): number => {
        // Check if car has active rentals first
        if (carsWithActiveRentals.has(car.id)) return 2; // Booked cars go to bottom
        
        // Normalize status: handle null, empty string, and different cases
        const rawStatus = car.status?.trim() || '';
        const carStatus = rawStatus.toLowerCase();
        // 0 = Available, 1 = Maintenance, 2 = Hidden/Ascuns/Booked (lower number = higher priority)
        if (carStatus === 'ascuns' || carStatus === 'hidden' || carStatus === 'booked' || carStatus === 'borrowed') return 2;
        if (carStatus === 'maintenance') return 1;
        return 0; // Default to available for null/empty/unknown statuses
    };

    // Filter and sort cars
    const filteredCars = useMemo(() => {
        let filtered = localCars.filter(car => {
            // Hide cars with deleted status
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();
            if (carStatus === 'deleted') return false;

            const carName = (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || '';
            const matchesSearch = carName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || car.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort based on selected field
        filtered.sort((a, b) => {
            if (sortBy === 'price') {
                // Sort by the lowest price range (2-4 days) as default
                const aPrice = a.price_2_4_days || a.price_5_15_days || a.price_16_30_days || a.price_over_30_days || 0;
                const bPrice = b.price_2_4_days || b.price_5_15_days || b.price_16_30_days || b.price_over_30_days || 0;
                const diff = aPrice - bPrice;
                return sortOrder === 'asc' ? diff : -diff;
            } else if (sortBy === 'year') {
                // Sort by year only
                const diff = a.year - b.year;
                return sortOrder === 'asc' ? diff : -diff;
            } else if (sortBy === 'status') {
                // Sort by status only
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                const diff = statusA - statusB;
                return sortOrder === 'asc' ? diff : -diff;
            } else {
                // Default: sort by availability first (available cars first)
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                return statusA - statusB; // Available (0) comes before Reserved (1) and Rented (2)
            }
        });

        return filtered;
    }, [localCars, searchQuery, filterCategory, sortBy, sortOrder]);

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

    const handleAddCar = () => {
        setEditingCar(null);
        setShowAddModal(true);
    };

    const handleEditCar = (car: CarType) => {
        setEditingCar(car);
        setSearchParams({ section: 'cars', carId: car.id.toString() });
    };

    const handleDeleteCar = async (carId: number) => {
        if (window.confirm(t('admin.cars.confirmDeleteCar'))) {
            try {
                // Soft delete: update status to 'deleted' instead of actually deleting
                await updateCar(carId, { status: 'deleted' });
                // Reload cars to get updated list (deleted cars will be filtered out)
                const fetchedCars = await fetchCars();
                setLocalCars(fetchedCars);
                showSuccess(t('admin.cars.carDeleted'));
            } catch (error) {
                console.error('Error deleting car:', error);
                showError(t('admin.cars.carDeleteError'));
            }
        }
    };

    const handleToggleStatus = async (car: CarType, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        
        // Check if car has active rentals - if so, don't allow toggle
        if (carsWithActiveRentals.has(car.id)) {
            showError(t('admin.cars.cannotToggleRentedCar') || 'Nu poți schimba statusul unei mașini care are închirieri active!');
            return;
        }
        
        // Calculate new status - toggle between "available" and "ascuns" (hidden)
        const rawStatus = car.status?.trim() || '';
        const carStatus = rawStatus.toLowerCase();
        const isHidden = carStatus === 'ascuns' || carStatus === 'hidden';
        const newStatus = isHidden ? 'available' : 'ascuns';
        const newStatusLabel = isHidden ? t('admin.cars.statusAvailable') : 'Ascuns';
        const carName = (car as any).name || `${car.make} ${car.model}`;
        
        // Confirm before changing status
        if (!window.confirm(`${t('admin.cars.confirmToggleStatus')} ${carName} ${t('admin.cars.toStatus')} ${newStatusLabel}?`)) {
            return;
        }
        
        // Set pending status for visual switch change (doesn't trigger sort)
        setPendingStatus(prev => new Map(prev).set(car.id, newStatus));
        setTogglingCarId(car.id);
        
        // Wait 0.5 seconds before updating actual status (triggers sort)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now update the actual status which will trigger re-sort
        setLocalCars(prev => prev.map(c => 
            c.id === car.id ? { ...c, status: newStatus } : c
        ));
        
        try {
            // Update database
            await updateCar(car.id, { status: newStatus });
            
            // Clear pending status and toggling state
            setPendingStatus(prev => {
                const newMap = new Map(prev);
                newMap.delete(car.id);
                return newMap;
            });
            setTogglingCarId(null);
            showSuccess(t('admin.cars.statusUpdated'));
        } catch (error) {
            console.error('Error updating car status:', error);
            // Revert pending status on error
            setPendingStatus(prev => {
                const newMap = new Map(prev);
                newMap.delete(car.id);
                return newMap;
            });
            setTogglingCarId(null);
            showError(t('admin.cars.statusUpdateError'));
        }
    };

    const handleSaveCar = async (carData: Partial<CarType>): Promise<number | void> => {
        try {
            if (editingCar) {
                // Update existing car - map form fields to database fields
                const updateData: Partial<CarType> & { name?: string } = {
                    ...carData,
                    name: (carData as any).name,
                    image_url: (carData as any).image || carData.image_url,
                    photo_gallery: (carData as any).photoGallery || carData.photo_gallery,
                    price_2_4_days: (carData as any).price_2_4_days,
                    price_5_15_days: (carData as any).price_5_15_days,
                    price_16_30_days: (carData as any).price_16_30_days,
                    price_over_30_days: (carData as any).price_over_30_days,
                    discount_percentage: (carData as any).discountPercentage !== undefined ? (carData as any).discountPercentage : carData.discount_percentage,
                    fuel_type: (carData as any).fuelType || carData.fuel_type,
                };
                const updatedCar = await updateCar(editingCar.id, updateData as Partial<CarType>);
                if (updatedCar) {
                    setLocalCars(prev => prev.map(c => c.id === editingCar.id ? updatedCar : c));
                    setShowAddModal(false);
                    setEditingCar(null);
                    // Success notification will be shown by the component
                }
            } else {
                // Add new car - map form fields to database fields
                // Ensure make and model are provided (required fields)
                const make = (carData as any).make || (carData as any).name?.split(' ')[0] || '';
                const model = (carData as any).model || (carData as any).name?.split(' ').slice(1).join(' ') || '';

                if (!make || !model) {
                    throw new Error('Make and Model are required fields');
                }

                const newCar = await createCar({
                    ...carData,
                    name: (carData as any).name,
                    make: make,
                    model: model,
                    image_url: (carData as any).image || carData.image_url,
                    photo_gallery: (carData as any).photoGallery || carData.photo_gallery,
                    price_2_4_days: (carData as any).price_2_4_days,
                    price_5_15_days: (carData as any).price_5_15_days,
                    price_16_30_days: (carData as any).price_16_30_days,
                    price_over_30_days: (carData as any).price_over_30_days,
                    discount_percentage: (carData as any).discountPercentage !== undefined ? (carData as any).discountPercentage : carData.discount_percentage,
                    fuel_type: (carData as any).fuelType || carData.fuel_type,
                    status: 'available',
                } as Partial<CarType>);
                if (newCar) {
                    setLocalCars(prev => [...prev, newCar]);
                    // Success notification will be shown by the component
                    return newCar.id;
                }
            }
        } catch (error) {
            console.error('Error saving car:', error);
            // Error notification will be shown by the component
            throw error; // Re-throw to let the component handle it
        }
    };

    // Set editingCar when carId is in URL and car is found
    useEffect(() => {
        if (carId) {
            const car = localCars.find(c => c.id.toString() === carId);
            if (car && (!editingCar || editingCar.id !== car.id)) {
                setEditingCar(car);
            }
        } else {
            // Clear editingCar when no carId in URL
            if (editingCar) {
                setEditingCar(null);
            }
        }
    }, [carId, localCars]);

    // If carId is in URL, show car details/edit view
    if (carId) {
        const car = localCars.find(c => c.id.toString() === carId);
        if (car) {
            return (
                <CarDetailsEditView
                    car={car}
                    onSave={async (carData) => {
                        try {
                            await handleSaveCar(carData);
                            // Reload cars after update
                            const fetchedCars = await fetchCars();
                            setLocalCars(fetchedCars);
                            // Navigation will be handled by onCancel in CarDetailsEditView
                        } catch (error) {
                            // Error is already handled in handleSaveCar
                        }
                    }}
                    onCancel={() => setSearchParams({ section: 'cars' })}
                />
            );
        } else if (!loading) {
            // Car not found, go back to cars list
            setSearchParams({ section: 'cars' });
        }
    }

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
            >
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </motion.div>
        );
    }

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
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('admin.cars.allCars')}</h2>
                            </div>
                            <button
                                onClick={handleAddCar}
                                className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                {t('admin.cars.addNew')}
                            </button>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            {/* Search */}
                            <div className="w-full md:flex-1 md:max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.placeholders.searchCars')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Sort Controls */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.cars.sortBy')}</span>
                                <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.cars.sortBy')}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleSort('price')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'price'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.price')}</span>
                                        {sortBy === 'price' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'price' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('year')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'year'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.year')}</span>
                                        {sortBy === 'year' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'year' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('status')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'status'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.status')}</span>
                                        {sortBy === 'status' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    {sortBy && (
                                        <button
                                            onClick={() => {
                                                setSortBy(null);
                                                setSortOrder('asc');
                                            }}
                                            className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                        >
                                            {t('admin.cars.clearSort')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                {filteredCars.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden p-4 space-y-4">
                            {filteredCars.map((car) => {
                                // Use pendingStatus for visual display, actual status for sorting
                                const displayStatus = pendingStatus.get(car.id) || car.status?.trim() || '';
                                const rawStatus = car.status?.trim() || '';
                                const carStatus = rawStatus.toLowerCase() || 'available';
                                const displayStatusLower = displayStatus.toLowerCase() || 'available';
                                const hasActiveRental = carsWithActiveRentals.has(car.id);
                                const isBooked = hasActiveRental || displayStatusLower === 'booked' || displayStatusLower === 'borrowed';
                                const isHidden = !isBooked && (displayStatusLower === 'ascuns' || displayStatusLower === 'hidden');
                                const isMaintenance = carStatus === 'maintenance';

                                return (
                                    <div
                                        key={car.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => handleEditCar(car)}
                                    >
                                        {/* Header: Car Image, Name and Status */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <img
                                                src={(car as any).image || car.image_url || ''}
                                                alt={(car as any).name || `${car.make} ${car.model}`}
                                                className="w-16 h-16 object-cover rounded-md border border-white/10 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="text-white font-semibold text-sm truncate flex-1">{(car as any).name || `${car.make} ${car.model}`}</h3>
                                                    {!isMaintenance && (
                                                        hasActiveRental ? (
                                                            <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/50 rounded-full">
                                                                {t('admin.cars.statusBooked')}
                                                            </span>
                                                        ) : (
                                                            <div 
                                                                className="flex-shrink-0"
                                                                onClick={(e) => handleToggleStatus(car, e)}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    disabled={togglingCarId === car.id}
                                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                                                                        togglingCarId === car.id 
                                                                            ? 'opacity-50 cursor-wait'
                                                                            : ''
                                                                    } ${
                                                                        isHidden ? 'bg-red-500' : 'bg-emerald-500'
                                                                    }`}
                                                                    role="switch"
                                                                    aria-checked={isHidden}
                                                                    aria-label={isHidden ? 'Ascuns' : t('admin.cars.statusAvailable')}
                                                                >
                                                <span
                                                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-500 ${
                                                                            isHidden ? 'translate-x-5' : 'translate-x-0.5'
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-xs mb-2">{car.body} · {car.seats} {t('admin.cars.seats')}</p>
                                                {isMaintenance && (
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl bg-yellow-500/20 text-yellow-300 border-yellow-500/50`}
                                                >
                                                        {t('admin.cars.statusMaintenance')}
                                                </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-white/10">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.cars.category')}</p>
                                                <p className="text-white text-sm font-medium capitalize">{car.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.cars.year')}</p>
                                                <p className="text-white text-sm font-medium">{car.year}</p>
                                            </div>
                                        </div>

                                        {/* Price Ranges */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-gray-400 text-xs font-medium">{t('admin.cars.priceRanges')}</p>
                                                {car.discount_percentage && car.discount_percentage > 0 && (
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 rounded-full">
                                                        -{car.discount_percentage}% OFF
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                    {(car.price_2_4_days || 0) > 0 && (
                                                    <div className="bg-white/5 border border-white/10 rounded p-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-300 text-xs">2-4 zile</span>
                                                            <div className="flex items-center gap-2">
                                                                {car.discount_percentage && car.discount_percentage > 0 && (
                                                                    <span className="text-gray-500 text-xs line-through">
                                                                        {car.price_2_4_days} MDL
                                                        </span>
                                                                )}
                                                                <span className="text-white font-semibold text-xs">
                                                                    {car.discount_percentage && car.discount_percentage > 0
                                                                        ? Math.round((car.price_2_4_days || 0) * (1 - car.discount_percentage / 100))
                                                                        : car.price_2_4_days
                                                                    } MDL
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    )}
                                                    {(car.price_5_15_days || 0) > 0 && (
                                                    <div className="bg-white/5 border border-white/10 rounded p-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-300 text-xs">5-15 zile</span>
                                                            <div className="flex items-center gap-2">
                                                                {car.discount_percentage && car.discount_percentage > 0 && (
                                                                    <span className="text-gray-500 text-xs line-through">
                                                                        {car.price_5_15_days} MDL
                                                        </span>
                                                                )}
                                                                <span className="text-white font-semibold text-xs">
                                                                    {car.discount_percentage && car.discount_percentage > 0
                                                                        ? Math.round((car.price_5_15_days || 0) * (1 - car.discount_percentage / 100))
                                                                        : car.price_5_15_days
                                                                    } MDL
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    )}
                                                    {(car.price_16_30_days || 0) > 0 && (
                                                    <div className="bg-white/5 border border-white/10 rounded p-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-300 text-xs">16-30 zile</span>
                                                            <div className="flex items-center gap-2">
                                                                {car.discount_percentage && car.discount_percentage > 0 && (
                                                                    <span className="text-gray-500 text-xs line-through">
                                                                        {car.price_16_30_days} MDL
                                                        </span>
                                                                )}
                                                                <span className="text-white font-semibold text-xs">
                                                                    {car.discount_percentage && car.discount_percentage > 0
                                                                        ? Math.round((car.price_16_30_days || 0) * (1 - car.discount_percentage / 100))
                                                                        : car.price_16_30_days
                                                                    } MDL
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    )}
                                                    {(car.price_over_30_days || 0) > 0 && (
                                                    <div className="bg-white/5 border border-white/10 rounded p-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-300 text-xs">30+ zile</span>
                                                            <div className="flex items-center gap-2">
                                                                {car.discount_percentage && car.discount_percentage > 0 && (
                                                                    <span className="text-gray-500 text-xs line-through">
                                                                        {car.price_over_30_days} MDL
                                                        </span>
                                                    )}
                                                                <span className="text-white font-semibold text-xs">
                                                                    {car.discount_percentage && car.discount_percentage > 0
                                                                        ? Math.round((car.price_over_30_days || 0) * (1 - car.discount_percentage / 100))
                                                                        : car.price_over_30_days
                                                                    } MDL
                                                                </span>
                                                </div>
                                            </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEditCar(car)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white hover:text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                                    title={t('admin.common.edit')}
                                                >
                                                    {/* @ts-ignore - react-icons type compatibility */}
                                                <LuPencil className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCar(car.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                                                    title={t('admin.common.delete')}
                                                >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                                </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.car')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.cars.category')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('price')}
                                                className="flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                                {t('admin.cars.priceRanges')}
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
                                                {t('admin.cars.year')}
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
                                                {t('admin.cars.status')}
                                                {sortBy === 'status' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.cars.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredCars.map((car) => {
                                        // Use pendingStatus for visual display, actual status for sorting
                                        const displayStatus = pendingStatus.get(car.id) || car.status?.trim() || '';
                                        const rawStatus = car.status?.trim() || '';
                                        const carStatus = rawStatus.toLowerCase() || 'available';
                                        const displayStatusLower = displayStatus.toLowerCase() || 'available';
                                        const hasActiveRental = carsWithActiveRentals.has(car.id);
                                        const isBooked = hasActiveRental || displayStatusLower === 'booked' || displayStatusLower === 'borrowed';
                                        const isHidden = !isBooked && (displayStatusLower === 'ascuns' || displayStatusLower === 'hidden');
                                        const isMaintenance = carStatus === 'maintenance';
                                        return (
                                            <tr
                                                key={car.id}
                                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => handleEditCar(car)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={(car as any).image || car.image_url || ''}
                                                            alt={(car as any).name || `${car.make} ${car.model}`}
                                                            className="w-12 h-12 object-cover rounded-md border border-white/10"
                                                        />
                                                        <div>
                                                            <p className="text-white font-semibold">{(car as any).name || `${car.make} ${car.model}`}</p>
                                                            <p className="text-gray-400 text-xs">{car.body} · {car.seats} {t('admin.cars.seats')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-semibold bg-white/10 text-gray-300 rounded capitalize">
                                                        {car.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5 max-w-xs">
                                                        {(car.price_2_4_days || 0) > 0 && (
                                                            <div className="bg-white/5 border border-white/10 rounded px-2 py-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-300 text-xs">2-4 zile</span>
                                                                    <span className="text-white font-semibold text-xs">
                                                                        {car.discount_percentage && car.discount_percentage > 0
                                                                            ? Math.round((car.price_2_4_days || 0) * (1 - car.discount_percentage / 100))
                                                                            : car.price_2_4_days
                                                                        } MDL
                                                            </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(car.price_5_15_days || 0) > 0 && (
                                                            <div className="bg-white/5 border border-white/10 rounded px-2 py-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-300 text-xs">5-15 zile</span>
                                                                    <span className="text-white font-semibold text-xs">
                                                                        {car.discount_percentage && car.discount_percentage > 0
                                                                            ? Math.round((car.price_5_15_days || 0) * (1 - car.discount_percentage / 100))
                                                                            : car.price_5_15_days
                                                                        } MDL
                                                            </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(car.price_16_30_days || 0) > 0 && (
                                                            <div className="bg-white/5 border border-white/10 rounded px-2 py-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-300 text-xs">16-30 zile</span>
                                                                    <span className="text-white font-semibold text-xs">
                                                                        {car.discount_percentage && car.discount_percentage > 0
                                                                            ? Math.round((car.price_16_30_days || 0) * (1 - car.discount_percentage / 100))
                                                                            : car.price_16_30_days
                                                                        } MDL
                                                            </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(car.price_over_30_days || 0) > 0 && (
                                                            <div className="bg-white/5 border border-white/10 rounded px-2 py-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-300 text-xs">30+ zile</span>
                                                                    <span className="text-white font-semibold text-xs">
                                                                        {car.discount_percentage && car.discount_percentage > 0
                                                                            ? Math.round((car.price_over_30_days || 0) * (1 - car.discount_percentage / 100))
                                                                            : car.price_over_30_days
                                                                        } MDL
                                                            </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{car.year}</td>
                                                <td className="px-6 py-4">
                                                    {isMaintenance ? (
                                                    <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl bg-yellow-500/20 text-yellow-300 border-yellow-500/50`}
                                                        >
                                                            {t('admin.cars.statusMaintenance')}
                                                        </span>
                                                    ) : hasActiveRental ? (
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl bg-red-500/20 text-red-300 border-red-500/50`}
                                                    >
                                                            {t('admin.cars.statusBooked')}
                                                        </span>
                                                    ) : (
                                                        <div 
                                                            className="flex items-center gap-2"
                                                            onClick={(e) => handleToggleStatus(car, e)}
                                                        >
                                                            <button
                                                                type="button"
                                                                disabled={togglingCarId === car.id}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                                                                    togglingCarId === car.id 
                                                                        ? 'opacity-50 cursor-wait'
                                                                        : ''
                                                                } ${
                                                                    isHidden ? 'bg-red-500' : 'bg-emerald-500'
                                                                }`}
                                                                role="switch"
                                                                aria-checked={isHidden}
                                                                aria-label={isHidden ? 'Ascuns' : t('admin.cars.statusAvailable')}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500 ${
                                                                        isHidden ? 'translate-x-6' : 'translate-x-1'
                                                                    }`}
                                                                />
                                                            </button>
                                                            <span className="text-xs text-gray-400">
                                                                {isHidden ? 'Ascuns' : t('admin.cars.statusAvailable')}
                                                    </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleEditCar(car)}
                                                            className="p-2 text-white hover:text-gray-300 transition-colors"
                                                            title={t('admin.common.edit')}
                                                        >
                                                            {/* @ts-ignore - react-icons type compatibility */}
                                                            <LuPencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCar(car.id)}
                                                            className="p-2 text-red-300 hover:text-red-200 transition-colors"
                                                            title={t('admin.common.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {searchQuery || filterCategory !== 'all' ? t('admin.cars.noCars') : t('admin.cars.noCars')}
                    </div>
                )}
            </div>

            {/* Add/Edit Car Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CarFormModal
                        car={editingCar}
                        onSave={async (carData) => {
                            try {
                                const result = await handleSaveCar(carData);
                                // Reload cars after save
                                const fetchedCars = await fetchCars();
                                setLocalCars(fetchedCars);
                                return result;
                            } catch (error) {
                                throw error;
                            }
                        }}
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

