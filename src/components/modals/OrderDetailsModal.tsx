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
    const startDate = new Date(order.startDate);
    const endDate = new Date(order.endDate);
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
                    customerPhone: order.customerPhone,
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
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Order Details</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Order #{orderNumber ? orderNumber.toString().padStart(4, '0') : 'N/A'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Customer Information */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Customer Information
                                    </h3>
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                            {getInitials(order.customerName)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-lg">{order.customerName}</p>
                                            {order.customerEmail && (
                                                <div className="flex items-center gap-2 mt-2 text-gray-300">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="text-sm">{order.customerEmail}</span>
                                                </div>
                                            )}
                                            {order.customerPhone && (
                                                <a
                                                    href={`tel:${order.customerPhone.replace(/\s/g, '')}`}
                                                    className="flex items-center gap-2 mt-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    <span className="text-sm">{order.customerPhone}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Rental Period */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Rental Period
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {order.carImage && (
                                                <img
                                                    src={order.carImage}
                                                    alt={order.carName}
                                                    className="w-12 h-8 object-cover rounded-md border border-white/10"
                                                />
                                            )}
                                            <span className="text-white font-semibold text-sm">{order.carName}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <p className="text-gray-400 text-sm mb-2">Pickup</p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-white font-semibold">{formatDate(order.startDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-300">{order.startTime}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <p className="text-gray-400 text-sm mb-2">Return</p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-white font-semibold">{formatDate(order.endDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-300">{order.endTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-gray-400 text-sm">Duration: <span className="text-white font-semibold">{days} day(s)</span></p>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                {order.amount > 0 && (
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5" />
                                            Financial Details
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Price per Day</span>
                                                <span className="text-white font-semibold">{car ? `${car.pricePerDay} MDL` : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Rental Days</span>
                                                <span className="text-white font-semibold">{days}</span>
                                            </div>
                                            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                                <span className="text-white font-semibold text-lg">Total Amount</span>
                                                <span className="text-emerald-400 font-bold text-xl">{order.amount.toFixed(2)} MDL</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Contract Download */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Contract
                                    </h3>
                                    <button
                                        onClick={downloadContract}
                                        disabled={isGeneratingContract || !car}
                                        className="w-full px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingContract ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generating Contract...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Download Contract PDF
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
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

