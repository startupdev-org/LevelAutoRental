import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Car, DollarSign, User, Mail, Download, FileText, Phone, Loader2 } from 'lucide-react';
import { OrderDisplay } from '../../lib/orders';
import { format } from 'date-fns';
import { cars } from '../../data/cars';
import { generateContractFromOrder } from '../../lib/contract';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDisplay | null;
    orderNumber?: number;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    onClose,
    order,
    orderNumber,
}) => {
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);

    if (!order) return null;

    const car = cars.find(c => c.id.toString() === order.carId);
    const startDate = new Date(order.pickupDate);
    const endDate = new Date(order.returnDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; border: string }> = {
            'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
            'APPROVED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
            'REJECTED': { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },
            'ACTIVE': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
            'COMPLETED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
            'CANCELLED': { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/50' },
        };

        const styles = statusMap[status] || statusMap['PENDING'];
        return (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border}`}>
                {status}
            </span>
        );
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const downloadContract = async () => {
        if (!car) {
            alert('Car information not found. Cannot generate contract.');
            return;
        }

        console.log('Starting contract generation...', { order, car, orderNumber });
        setIsGeneratingContract(true);
        try {
            const contractNumber = orderNumber
                ? `CT-${orderNumber.toString().padStart(4, '0')}-${new Date().getFullYear()}`
                : undefined;

            await generateContractFromOrder(
                order,
                car,
                contractNumber,
                {
                    // customerPhone: order.customerPhone,
                    // Additional data can be added here if available
                    // customerAddress, customerIdNumber, etc.
                }
            );
            console.log('Contract generation completed successfully');
        } catch (error) {
            console.error('Error generating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate contract: ${errorMessage}\n\nPlease check the browser console for more details.`);
        } finally {
            setIsGeneratingContract(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    style={{ zIndex: 10000 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
                    >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Order Details</h2>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                    Order #{orderNumber ? orderNumber.toString().padStart(4, '0') : 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Customer Information */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-sm sm:text-base">Customer Information</span>
                                </h3>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0">
                                        {order.customerName ? getInitials(order.customerName) : 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-base sm:text-lg truncate">
                                            {order.customerName || 'Unknown Customer'}
                                        </p>
                                        {order.customerEmail && (
                                            <div className="flex items-center gap-2 mt-2 text-gray-300">
                                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm truncate">{order.customerEmail}</span>
                                            </div>
                                        )}
                                        {order.customerPhone && (
                                            <a
                                                href={`tel:${order.customerPhone.replace(/\s/g, '')}`}
                                                className="flex items-center gap-2 mt-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{order.customerPhone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rental Period */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-sm sm:text-base">Rental Period</span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {order.avatar && (
                                            <img
                                                src={order.avatar}
                                                alt={order.carName || car?.name || 'Car'}
                                                className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded-md border border-white/10"
                                            />
                                        )}
                                        <span className="text-white font-semibold text-xs sm:text-sm">
                                            {order.carName || car?.name || 'Unknown Car'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                        <p className="text-gray-400 text-xs sm:text-sm mb-2">Pickup</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-white font-semibold text-sm sm:text-base">{formatDate(order.pickupDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm sm:text-base">{order.pickupTime}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                        <p className="text-gray-400 text-xs sm:text-sm mb-2">Return</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-white font-semibold text-sm sm:text-base">{formatDate(order.returnDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm sm:text-base">{order.returnTime}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-xs sm:text-sm">Duration: <span className="text-white font-semibold">{days} day(s)</span></p>
                                </div>
                            </div>

                            {/* Financial Details */}
                            {(
                                <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-sm sm:text-base">Financial Details</span>
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300 text-xs sm:text-sm">Price per Day</span>
                                            <span className="text-white font-semibold text-sm sm:text-base">{car ? `${car.pricePerDay} MDL` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300 text-xs sm:text-sm">Rental Days</span>
                                            <span className="text-white font-semibold text-sm sm:text-base">{days}</span>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-white font-semibold text-base sm:text-lg">Total Amount</span>
                                            <span className="text-emerald-400 font-bold text-lg sm:text-xl">{order.total_amount} MDL</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contract Download */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-sm sm:text-base">Contract</span>
                                </h3>
                                <button
                                    onClick={downloadContract}
                                    disabled={isGeneratingContract || !car}
                                    className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingContract ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Generating Contract...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>Download Contract PDF</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                    Generates a complete Romanian rental contract with all annexes
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

