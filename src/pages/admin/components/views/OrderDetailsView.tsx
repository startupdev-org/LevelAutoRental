import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Download, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCars } from '../../../../lib/cars';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';
import { Car as CarType } from '../../../../types';
import { OrderDisplay } from '../../../../lib/orders';
import { cancelRentalOrder, redoRentalOrder } from '../../../../lib/orders';
import { generateContractFromOrder } from '../../../../lib/contract';
import { getDateDiffInDays } from '../../../../utils/date';

interface OrderDetailsViewProps {
    orderId: string;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ orderId }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [ordersList, setOrdersList] = useState<OrderDisplay[]>([]);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cars, setCars] = useState<CarType[]>([]);

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();

                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );

                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            }
        };
        loadCars();
    }, []);

    const loadOrders = async () => {
        if (cars.length === 0) return;
        try {
            const { fetchRentalsForCalendarPageByMonth: fetchRentalsOnly } = await import('../../../../lib/orders');
            const data = await fetchRentalsOnly(cars);
            const rentalsOnly = data.filter(order => order.type === 'rental');
            setOrdersList(rentalsOnly);
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    };

    useEffect(() => {
        if (cars.length > 0) {
            loadOrders();
        }
    }, [cars]);

    const handleCancelOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(t('admin.orders.confirmCancelOrder'))) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                alert(t('admin.orders.orderCancelled'));
                await loadOrders();
                // Navigate back to orders list
                navigate('/admin?section=orders');
            } else {
                alert(`${t('admin.orders.orderCancelFailed')} ${result.error}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(t('admin.orders.orderCancelErrorOccurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRedoOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(t('admin.orders.confirmRestoreOrder'))) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await redoRentalOrder(order.id.toString());
            if (result.success) {
                alert(t('admin.orders.orderRestored'));
                await loadOrders();
            } else {
                alert(`${t('admin.orders.orderRestoreFailed')} ${result.error}`);
            }
        } catch (error) {
            console.error('Error restoring order:', error);
            alert(t('admin.orders.orderRestoreErrorOccurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    const order = ordersList.find((o) => o.id === orderId);
    const car = order ? cars.find(c => c.id.toString() === order.carId) : null;
    const [selectedImage, setSelectedImage] = useState<string | undefined>((car as any)?.image || car?.image_url);

    useEffect(() => {
        if (!order || !car) {
            if (ordersList.length > 0) {
                navigate('/admin?section=orders');
            }
        } else {
            setSelectedImage((car as any).image || car.image_url || '');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [orderId, order, car, navigate, ordersList.length]);

    const handleDownloadContract = async () => {
        if (!order || !car) {
            alert(t('admin.orders.contractNotFound'));
            return;
        }

        console.log('Starting contract generation...', { order, car });
        setIsGeneratingContract(true);
        try {
            await generateContractFromOrder(
                order,
                car,
                undefined,
                {
                    customerPhone: order.customerPhone || '',
                } as any
            );
            console.log('Contract generation completed successfully');
        } catch (error) {
            console.error('Error generating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`${t('admin.orders.contractGenerationFailed')}: ${errorMessage}\n\n${t('admin.orders.contractGenerationErrorDetails')}`);
        } finally {
            setIsGeneratingContract(false);
        }
    };

    if (!order || !car) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8"
        >
            {/* LEFT COLUMN: Order + Car Info */}
            <div className="space-y-6">
                {/* Car Summary */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-red-500/50 rounded-xl p-6 transition-all shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={selectedImage}
                            alt={(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                            className="w-32 h-20 object-cover rounded-lg border border-white/20"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white">{(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}</h2>
                            <div className="text-sm text-gray-300">{car.transmission} · {car.seats} seats</div>
                        </div>
                    </div>
                </motion.div>

                {/* Booking Details */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 space-y-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white">{t('admin.orders.bookingInfo')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                                <span className="text-white text-sm font-medium">{new Date(order.pickupDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.pickupTime || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{new Date(order.returnDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.returnTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(order.pickupDate, order.returnDate)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Price</p>
                            <span className="text-white text-lg font-bold">{(order.amount ?? 0) > 0 ? `${order.amount} MDL` : `${getDateDiffInDays(order.pickupDate, order.returnDate) * car.price_per_day} MDL`}</span>
                        </div>
                    </div>

                    {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                        <>
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.additionalFeatures')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {(car.features as string[] || []).map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Customer Info */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Customer</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            C
                        </div>
                        <div>
                            <div className="text-white font-semibold">{order.customerName}</div>
                            <div className="text-gray-300 text-sm">{order.customerEmail}</div>
                            {order.customerPhone && (
                                <div className="text-gray-300 text-sm mt-1">{order.customerPhone}</div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Payment & Status */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">{t('admin.orders.payment')}</h2>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400 text-sm uppercase tracking-wide">Amount Paid</span>
                            <div className="text-white font-bold text-2xl">{order.amount} MDL</div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl
                            ${order.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' :
                                order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                                    'bg-red-500/20 text-red-300 border-red-500/50'}`}>
                            {order.status}
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* RIGHT COLUMN: Actions */}
            <aside className="lg:col-start-2">
                <motion.div
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="sticky top-24 space-y-3"
                >
                    <button
                        onClick={handleDownloadContract}
                        disabled={isGeneratingContract}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingContract ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <FileText className="w-4 h-4" />
                                Download Contract
                            </>
                        )}
                    </button>
                    <button
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                        onClick={() => navigate(`/admin?section=orders&orderId=${order.id}&edit=true`)}
                    >
                        Edit Order
                    </button>
                    {order.status !== 'CANCELLED' && (
                        <button
                            className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleCancelOrder}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <X className="w-4 h-4" />
                                    Cancel Order
                                </>
                            )}
                        </button>
                    )}
                    {order.status === 'CANCELLED' && (
                        <button
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleRedoOrder}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Undo Cancel
                                </>
                            )}
                        </button>
                    )}
                </motion.div>
            </aside>
        </motion.div>
    );
};

