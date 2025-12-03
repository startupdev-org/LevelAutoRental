import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowRight,
    Upload,
    Loader2,
    Check,
    Save,
    CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Car as CarType } from '../../../../types';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { LiaCarSideSolid } from 'react-icons/lia';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';

interface CarFormModalProps {
    car: CarType | null;
    onSave: (carData: Partial<CarType>) => Promise<number | void>;
    onClose: () => void;
}

export const CarFormModal: React.FC<CarFormModalProps> = ({ car, onSave, onClose }) => {
    const [, setSearchParams] = useSearchParams();
    const { t } = useTranslation();
    // Normalize category to array format for form
    const initialCategory = car 
        ? (Array.isArray(car.category) 
            ? car.category 
            : car.category 
                ? [car.category] 
                : ['luxury'])
        : ['luxury'];
    const [formData, setFormData] = useState<Partial<CarType>>(
        car ? {
            ...car,
            category: initialCategory,
        } : {
            name: '',
            category: ['luxury'],
            image: '',
            pricePerDay: 0,
            year: new Date().getFullYear(),
            seats: 5,
        } as any
    );
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [carAdded, setCarAdded] = useState(false);
    const [newCarId, setNewCarId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const { showSuccess, showError } = useNotification();

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

            // Ensure category is in the correct format
            const formDataWithCategory = {
                ...formData,
                category: categories.length === 1 ? categories[0] : categories,
            };

            if (!car) {
                // Adding new car
                const carId = await onSave(formDataWithCategory);
                if (typeof carId === 'number') {
                    setNewCarId(carId);
                    setCarAdded(true);

                    // Upload pending image if one was selected
                    if (pendingImageFile) {
                        await uploadPendingImage(carId, (formDataWithCategory as any).name || 'car');
                    }

                    showSuccess(t('admin.cars.carCreated'));
                    // Don't auto-close - let user click Continue or Close
                }
            } else {
                // Editing existing car
                await onSave(formDataWithCategory);
                showSuccess(t('admin.cars.carUpdated'));
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (error) {
            console.error('Error saving car:', error);
            showError('Failed to save car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (newCarId) {
            setSearchParams({ section: 'cars', carId: newCarId.toString() });
            onClose();
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
        // For new cars, store the file to upload after car creation
        // For existing cars, upload immediately
        if (!car) {
            setPendingImageFile(file);
            showSuccess(t('admin.cars.imageSelected'));
        } else {
            // Existing car - upload immediately (same as CarDetailsEditView)
            setUploadingMainImage(true);
            try {
                // Check if supabaseAdmin is available (service key required)
                if (!import.meta.env.VITE_SUPABASE_SERVICE_KEY) {
                    throw new Error('Service key not available for file upload');
                }

                const carName = (formData as any).name || (car as any).name || 'car';
                const folderName = createFolderName(carName);
                const modelPart = getModelPart(carName);
                const fileName = `${modelPart}-main.jpg`;
                const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage (try regular client first, fallback to admin)
            let uploadData, uploadError;
            try {
                const result = await supabase.storage
                    .from('cars')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true // Replace if exists
                    });
                uploadData = result.data;
                uploadError = result.error;
            } catch (regularError) {
                // Fallback to admin client if regular client fails
                console.warn('Regular client upload failed, trying admin client:', regularError);
                const adminResult = await supabaseAdmin.storage
                    .from('cars')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true // Replace if exists
                    });
                uploadData = adminResult.data;
                uploadError = adminResult.error;
            }

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
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
        }
    };

    // Function to upload pending image after car creation
    const uploadPendingImage = async (carId: number, carName: string) => {
        if (!pendingImageFile) return;

        setUploadingMainImage(true);
        try {
            // Check if supabaseAdmin is available (service key required)
            if (!import.meta.env.VITE_SUPABASE_SERVICE_KEY) {
                throw new Error('Service key not available for file upload');
            }

            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            const fileName = `${modelPart}-main.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage (try regular client first, fallback to admin)
            let uploadData, uploadError;
            try {
                const result = await supabase.storage
                    .from('cars')
                    .upload(filePath, pendingImageFile, {
                        cacheControl: '3600',
                        upsert: true // Replace if exists
                    });
                uploadData = result.data;
                uploadError = result.error;
            } catch (regularError) {
                // Fallback to admin client if regular client fails
                console.warn('Regular client upload failed, trying admin client:', regularError);
                const adminResult = await supabaseAdmin.storage
                    .from('cars')
                    .upload(filePath, pendingImageFile, {
                        cacheControl: '3600',
                        upsert: true // Replace if exists
                    });
                uploadData = adminResult.data;
                uploadError = adminResult.error;
            }

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update the car record with the image URL
            const { error: updateError } = await supabaseAdmin
                .from('Cars')
                .update({
                    image_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', carId);

            if (updateError) {
                console.error('Error updating car with image URL:', updateError);
            }

            showSuccess(t('admin.cars.imageUploaded'));
        } catch (error) {
            console.error('Error uploading pending image:', error);
            showError(t('admin.cars.imageUploadError'));
        } finally {
            setUploadingMainImage(false);
            setPendingImageFile(null);
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
                        <h2 className="text-2xl font-bold text-white">{t('admin.cars.addNew')}</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {t('admin.cars.addNewDescription')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {!carAdded ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                {React.createElement(LiaCarSideSolid as any, { className: "w-5 h-5" })}
                                {t('admin.cars.basicInfo')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.carName')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).name || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).name = e.target.value;
                                            return updated;
                                        })}
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.make')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).make || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).make = e.target.value;
                                            return updated;
                                        })}
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.model')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).model || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).model = e.target.value;
                                            return updated;
                                        })}
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.category')} *</label>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.year')} *</label>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.seats')} *</label>
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

                                {/* Price Ranges */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">2-4 zile *</label>
                                        <input
                                            type="number"
                                            value={(formData as any).price_2_4_days || formData.price_2_4_days || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                price_2_4_days: parseFloat(e.target.value) || 0
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
                                        <p className="text-xs text-gray-400 mt-1">MDL pe zi</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">5-15 zile *</label>
                                        <input
                                            type="number"
                                            value={(formData as any).price_5_15_days || formData.price_5_15_days || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                price_5_15_days: parseFloat(e.target.value) || 0
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
                                        <p className="text-xs text-gray-400 mt-1">MDL pe zi</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">16-30 zile *</label>
                                        <input
                                            type="number"
                                            value={(formData as any).price_16_30_days || formData.price_16_30_days || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                price_16_30_days: parseFloat(e.target.value) || 0
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
                                        <p className="text-xs text-gray-400 mt-1">MDL pe zi</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Peste 30 zile *</label>
                                        <input
                                            type="number"
                                            value={(formData as any).price_over_30_days || formData.price_over_30_days || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                price_over_30_days: parseFloat(e.target.value) || 0
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
                                        <p className="text-xs text-gray-400 mt-1">MDL pe zi</p>
                                    </div>
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
                                            } as any));
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
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                {t('admin.cars.mainImage')}
                            </h3>
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
                                {pendingImageFile && !uploadingMainImage && (
                                    <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        {t('admin.cars.imageSelectedWillUpload')}
                                    </p>
                                )}
                                {((formData as any).image || formData.image_url) && (
                                    <div className="mt-2 inline-block">
                                        <img src={(formData as any).image || formData.image_url || ''} alt="Preview" className="h-20 object-contain rounded-lg border border-white/10" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
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
                                        {t('admin.cars.addCar')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center space-y-4">
                        <div className="text-green-400 mb-4">
                            <CheckCircle className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('admin.cars.carAddedSuccess')}</h3>
                        <p className="text-gray-300">{t('admin.cars.carAddedDescription')}</p>
                        <div className="flex gap-4 justify-center pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                            >
                                {t('admin.cars.close')}
                            </button>
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                            >
                                {t('admin.cars.continue')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
};

// CalendarView and UsersView are now imported from components/views
// const CalendarView: React.FC = () => { ... }
// const UsersView: React.FC = () => ( ... )

// Requests View Component
