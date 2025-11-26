import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Check,
    X,
    Loader2,
    Plus,
    Save,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCarById } from '../../../../lib/cars';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';
import { Car as CarType } from '../../../../types';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { supabaseAdmin } from '../../../../lib/supabase';

export interface CarDetailsEditViewProps {
    car: CarType;
    onSave: (carData: Partial<CarType>) => Promise<void>;
    onCancel: () => void;
}

export const CarDetailsEditView: React.FC<CarDetailsEditViewProps> = ({ car, onSave, onCancel }) => {
    const { t } = useTranslation();
    // Normalize category to array format for form
    const normalizedCategory = Array.isArray(car.category) 
        ? car.category 
        : car.category 
            ? [car.category] 
            : [];
    const [formData, setFormData] = useState<Partial<CarType>>({
        ...car,
        category: normalizedCategory,
    });
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useNotification();
    const [newFeature, setNewFeature] = useState('');
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Fetch fresh car data when component mounts
    useEffect(() => {
        const loadCar = async () => {
            try {
                const fetchedCar = await fetchCarById(car.id);
                if (fetchedCar) {
                    // Fetch images from storage
                    const carName = (fetchedCar as any).name || `${fetchedCar.make} ${fetchedCar.model}`;
                    const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                    
                    // Ensure name field is included and normalize category to array
                    const normalizedCategory = Array.isArray(fetchedCar.category) 
                        ? fetchedCar.category 
                        : fetchedCar.category 
                            ? [fetchedCar.category] 
                            : [];
                    setFormData({
                        ...fetchedCar,
                        name: fetchedCar.name || '',
                        discountPercentage: fetchedCar.discount_percentage,
                        discount_percentage: fetchedCar.discount_percentage,
                        image_url: mainImage || fetchedCar.image_url,
                        photo_gallery: photoGallery.length > 0 ? photoGallery : fetchedCar.photo_gallery,
                        category: normalizedCategory,
                    } as any);
                }
            } catch (error) {
                console.error('Error loading car:', error);
            }
        };
        loadCar();
    }, [car.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate at least one category is selected
            const categories = Array.isArray(formData.category) 
                ? formData.category 
                : formData.category 
                    ? [formData.category] 
                    : [];
            if (categories.length === 0) {
                showError(t('admin.cars.categoryRequired') || 'Please select at least one category');
                setLoading(false);
                return;
            }

            // Map form data to database fields
            const carDataToSave: Partial<CarType> & { name?: string } = {
                ...formData,
                name: (formData as any).name,
                image_url: (formData as any).image || formData.image_url,
                photo_gallery: (formData as any).photoGallery || formData.photo_gallery,
                price_per_day: (formData as any).pricePerDay || formData.price_per_day,
                discount_percentage: (formData as any).discountPercentage !== undefined ? (formData as any).discountPercentage : formData.discount_percentage,
                fuel_type: (formData as any).fuelType || formData.fuel_type,
                category: categories.length === 1 ? categories[0] : categories,
            };
            await onSave(carDataToSave as Partial<CarType>);
            // Show success notification
            showSuccess(t('admin.cars.carSaved'));
            // Close the edit view after a short delay to show the notification
            setTimeout(() => {
                onCancel();
            }, 500);
        } catch (error) {
            console.error('Error saving car:', error);
            showError('Failed to save car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to create folder name from car name
    const createFolderName = (carName: string): string => {
        return carName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Helper function to extract model part from car name for file naming
    // Example: "BMW X4" → "x4", "Mercedes C43" → "c43", "Mercedes CLS 350" → "cls-350"
    const getModelPart = (carName: string): string => {
        const parts = carName.trim().split(/\s+/);
        if (parts.length < 2) return 'car';
        // Take everything after the first word (make) as the model
        const modelParts = parts.slice(1);
        return modelParts
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Function for uploading main image to Supabase storage
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            const carName = (formData as any).name || (car as any).name || 'car';
            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            const fileName = `${modelPart}-main.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('cars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Replace if exists
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update form data with the public URL
            setFormData(prev => ({
                ...prev,
                image: publicUrl,
                image_url: publicUrl
            }));

            showSuccess(t('admin.cars.imageUploaded'));
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(t('admin.cars.imageUploadError'));
        } finally {
            setUploadingMainImage(false);
        }
    };

    // Function for uploading gallery image to Supabase storage
    const handleGalleryImageUpload = async (file: File) => {
        setUploadingGalleryImage(true);
        try {
            const carName = (formData as any).name || (car as any).name || 'car';
            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            
            // Get existing gallery images to determine next number
            const currentGallery = (formData as any).photoGallery || formData.photo_gallery || [];
            // Try to find the highest number in existing gallery images
            let nextNumber = 2; // Start from 2 (1 would be the main image)
            if (currentGallery.length > 0) {
                const numbers = currentGallery
                    .map((url: string) => {
                        const match = url.match(/-(\d+)\.(jpg|jpeg|png)/i);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter((n: number) => n > 0);
                if (numbers.length > 0) {
                    nextNumber = Math.max(...numbers) + 1;
                }
            }
            
            const fileName = `${modelPart}-${nextNumber}.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('cars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update form data with the public URL (reuse currentGallery from above)
            setFormData(prev => ({
                ...prev,
                photoGallery: [...currentGallery, publicUrl],
                photo_gallery: [...currentGallery, publicUrl]
            }));

            showSuccess(t('admin.cars.galleryImageUploaded'));
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(t('admin.cars.imageUploadError'));
        } finally {
            setUploadingGalleryImage(false);
        }
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...(prev.features || []), newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features?.filter((_, i) => i !== index) || []
        }));
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photo_gallery: ((prev as any).photoGallery || prev.photo_gallery || []).filter((_: any, i: number) => i !== index)
        }));
    };

    return (
        <div className="space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.basicInfo')}</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.carName')}</label>
                            <input
                                type="text"
                                value={(formData as any).name || (car as any).name || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                } as any))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.year')}</label>
                                <input
                                    type="number"
                                    value={formData.year || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.seats')}</label>
                                <input
                                    type="number"
                                    value={formData.seats || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.category')}</label>
                            <div className="flex flex-col md:flex-row md:gap-4 gap-2">
                                {['suv', 'sports', 'luxury'].map((cat) => {
                                    const categories = Array.isArray(formData.category) 
                                        ? formData.category 
                                        : formData.category 
                                            ? [formData.category] 
                                            : [];
                                    const isChecked = categories.includes(cat as 'suv' | 'sports' | 'luxury');
                                    return (
                                        <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const currentCategories = Array.isArray(formData.category) 
                                                        ? formData.category 
                                                        : formData.category 
                                                            ? [formData.category] 
                                                            : [];
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            category: [...currentCategories, cat] as ('suv' | 'sports' | 'luxury')[]
                                                        }));
                                                    } else {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            category: currentCategories.filter(c => c !== cat) as ('suv' | 'sports' | 'luxury')[]
                                                        }));
                                                    }
                                                }}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                isChecked
                                                    ? 'bg-red-500 border-red-500'
                                                    : 'border-white/30 bg-white/5 group-hover:border-red-400'
                                            }`}>
                                                {isChecked && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-white">
                                                {cat === 'suv' ? t('admin.cars.categorySuv') : 
                                                 cat === 'sports' ? t('admin.cars.categorySports') : 
                                                 t('admin.cars.categoryLuxury')}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.pricePerDay')}</label>
                            <input
                                type="number"
                                value={(formData as any).pricePerDay || formData.price_per_day || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    pricePerDay: parseFloat(e.target.value),
                                    price_per_day: parseFloat(e.target.value)
                                }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.discountPercentage')}</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={(formData as any).discountPercentage !== undefined ? (formData as any).discountPercentage : (formData.discount_percentage !== undefined ? formData.discount_percentage : '')}
                                onChange={(e) => {
                                    const discountValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        discountPercentage: discountValue,
                                        discount_percentage: discountValue
                                    }));
                                }}
                                placeholder="0"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('admin.cars.discountPercentageHint')}</p>
                            {(() => {
                                // Get base price - handle both naming conventions
                                const pricePerDay = (formData as any).pricePerDay;
                                const price_per_day = formData.price_per_day;
                                const basePriceValue = pricePerDay !== undefined && pricePerDay !== null
                                    ? pricePerDay
                                    : (price_per_day !== undefined && price_per_day !== null ? price_per_day : 0);
                                const basePrice = typeof basePriceValue === 'number' ? basePriceValue : parseFloat(String(basePriceValue)) || 0;
                                
                                // Get discount - handle both naming conventions and null/undefined
                                const discountPercentage = (formData as any).discountPercentage;
                                const discount_percentage = formData.discount_percentage;
                                const discountValue = discountPercentage !== undefined && discountPercentage !== null
                                    ? discountPercentage
                                    : (discount_percentage !== undefined && discount_percentage !== null ? discount_percentage : 0);
                                const discount = typeof discountValue === 'number' ? discountValue : parseFloat(String(discountValue)) || 0;
                                
                                // Check if we have valid values
                                const hasValidPrice = !isNaN(basePrice) && basePrice > 0;
                                const hasValidDiscount = !isNaN(discount) && discount > 0 && discount <= 100;
                                
                                if (hasValidPrice && hasValidDiscount) {
                                    const discountedPrice = basePrice * (1 - discount / 100);
                                    return (
                                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                            <p className="text-xs text-emerald-400 font-medium">
                                                {t('admin.cars.discountedPrice')}: {discountedPrice.toFixed(2)} MDL
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.specifications')}</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.bodyType')}</label>
                            <select
                                value={formData.body || 'Sedan'}
                                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value as CarType['body'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="Coupe">Coupe</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.transmission')}</label>
                            <select
                                value={formData.transmission || 'Automatic'}
                                onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value as CarType['transmission'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.fuelType')}</label>
                            <select
                                value={(formData as any).fuelType || formData.fuel_type || 'gasoline'}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    fuelType: e.target.value as CarType['fuel_type'],
                                    fuel_type: e.target.value as CarType['fuel_type']
                                }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="electric">Electric</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.drivetrain')}</label>
                            <input
                                type="text"
                                value={formData.drivetrain || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, drivetrain: e.target.value }))}
                                placeholder={t('admin.placeholders.drivetrain')}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.images')}</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.mainImage')}</label>
                        <div>
                            <label className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('admin.cars.uploadImage')}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleMainImageUpload(file);
                                    }}
                                    className="hidden"
                                    disabled={uploadingMainImage}
                                />
                            </label>
                            {uploadingMainImage && (
                                <p className="text-xs text-gray-400 mb-2">{t('admin.cars.uploadingImage')}</p>
                            )}
                            {(formData.image_url || (formData as any).image) && (
                                <div className="mt-2 inline-block relative group cursor-pointer" onClick={() => {
                                    setSelectedImageIndex(0);
                                    setShowImageGallery(true);
                                }}>
                                    <img src={formData.image_url || (formData as any).image} alt="Preview" className="h-20 object-contain rounded-lg border border-white/10" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                        {t('admin.cars.mainPhoto')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.photoGallery')}</label>
                        <div className="flex gap-2 mb-2">
                            <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('admin.cars.uploadImage')}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleGalleryImageUpload(file);
                                    }}
                                    className="hidden"
                                    disabled={uploadingGalleryImage}
                                />
                            </label>
                            {uploadingGalleryImage && (
                                <p className="text-xs text-gray-400 flex items-center">{t('admin.common.uploading')}</p>
                            )}
                        </div>
                        {((formData as any).photoGallery || formData.photo_gallery || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {((formData as any).photoGallery || formData.photo_gallery || []).map((url: string, index: number) => (
                                    <div key={index} className="relative group inline-block">
                                        <img
                                            src={url}
                                            alt={`${t('admin.cars.gallery')} ${index + 1}`}
                                            className="h-20 object-contain rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                setSelectedImageIndex(index + 1);
                                                setShowImageGallery(true);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeGalleryImage(index);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.features')}</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            placeholder={t('admin.placeholders.addFeature')}
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                        />
                        <button
                            type="button"
                            onClick={addFeature}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.features?.map((feature, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            >
                                {feature}
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="hover:text-red-300 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Status & Ratings */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.statusAndRatings')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.rating')}</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={formData.rating || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.reviewsCount')}</label>
                            <input
                                type="number"
                                value={formData.reviews || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                        {t('admin.cars.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('admin.cars.saving')}
                            </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {t('admin.common.save')}
                                </>
                            )}
                    </button>
                </div>
            </form>

            {/* Image Gallery Modal */}
            {showImageGallery && createPortal(
                <AnimatePresence>
                    {showImageGallery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                            onClick={() => setShowImageGallery(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full h-full flex flex-col"
                            >
                                {/* Header Bar */}
                                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const allImages = [
                                                formData.image_url || (formData as any).image,
                                                ...((formData as any).photoGallery || formData.photo_gallery || [])
                                            ].filter(Boolean);

                                            if (allImages.length <= 1) return null;

                                            return (
                                                <span className="text-white/70 text-sm font-medium">
                                                    {selectedImageIndex + 1} of {allImages.length}
                                                </span>
                                            );
                                        })()}
                                        {selectedImageIndex === 0 && (
                                            <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                                                Main Photo
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowImageGallery(false)}
                                        className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Image Display */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                                    {(() => {
                                        const allImages = [
                                            formData.image_url || (formData as any).image,
                                            ...((formData as any).photoGallery || formData.photo_gallery || [])
                                        ].filter(Boolean);
                                        const currentImage = allImages[selectedImageIndex];

                                        return currentImage ? (
                                            <div className="w-full h-full max-w-full max-h-[75vh] flex items-center justify-center">
                                                <img
                                                    src={currentImage}
                                                    alt={`Image ${selectedImageIndex + 1}`}
                                                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                                                />
                                            </div>
                                        ) : null;
                                    })()}

                                </div>

                                {/* Photo Grid */}
                                {(() => {
                                    const allImages = [
                                        formData.image_url || (formData as any).image,
                                        ...((formData as any).photoGallery || formData.photo_gallery || [])
                                    ].filter(Boolean);

                                    if (allImages.length <= 1) return null;

                                    return (
                                        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                                            <div className="px-6 py-4">
                                                <div className="grid grid-cols-6 gap-3 max-w-4xl mx-auto">
                                                    {allImages.map((url: string, index: number) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setSelectedImageIndex(index)}
                                                            className={`relative transition-all ${selectedImageIndex === index
                                                                ? 'opacity-100'
                                                                : 'opacity-50 hover:opacity-80'
                                                                }`}
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Thumbnail ${index + 1}`}
                                                                className={`w-full h-20 object-cover rounded-lg transition-all ${selectedImageIndex === index
                                                                    ? 'border-2 border-white'
                                                                    : 'border border-white/20'
                                                                    }`}
                                                            />
                                                            {index === 0 && (
                                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white/20"></div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
