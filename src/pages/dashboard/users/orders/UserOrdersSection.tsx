import { useTranslation } from "react-i18next"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Download,
    Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { UserOrdersTable } from '../../../../components/dashboard/user/orders/UsersOrdersTable';

import { orders } from '../../../../data/index'
import { OrderDisplay } from "../../../../lib/orders";
import { OrderDetailsModal } from "../../../../components/modals/OrderDetailsModal";

export const UserOrdersSection: React.FC = () => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);


    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const handleOrderClick = (order: OrderDisplay) => {
        console.log('handling order click for order: ', order)
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (

        <>
            <h2 className="text-4xl font-bold text-white">{t('dashboard.bookings.title')}</h2>

            {/* Current Borrowed Cars */}
            {
                orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders
                            .filter((order) => order.status.toLowerCase() === 'active') // doar comenzile în uz
                            .map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Optional car image */}
                                        <img
                                            src={order.avatar}
                                            alt={order.carId}
                                            className="w-24 h-24 rounded-lg object-cover"
                                            onClick={() => handleOrderClick(order)}
                                        />

                                        <div className="flex-1">
                                            {/* Car name */}
                                            <h3 className="font-semibold text-white text-lg mb-2">car_name</h3>

                                            {/* Dates & pickup location */}
                                            <div className="flex items-center gap-4 text-sm font-semibold text-gray-400 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(order.pickupDate)} {order.pickupTime} - {formatDate(order.returnDate)} {order.returnTime}
                                                </span>
                                            </div>

                                            {/* Total amount */}
                                            <div className="text-sm font-semibold text-gray-300 mb-2">
                                                <span className="font-semibold">Total:</span> {order.total_amount} MDL
                                            </div>

                                            {/* Status */}
                                            {/* <div className="flex items-center gap-2 mb-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${getStatusColor(
                                                        order.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(order.status)}
                                                    <span className="capitalize">{order.status}</span>
                                                </span>
                                            </div> */}

                                        </div>

                                        {/* Actions */}
                                        <div className="text-right flex flex-col gap-2">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <button
                                                    onClick={() => handleOrderClick(order)}
                                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t('dashboard.bookings.details')}
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg hover:border-green-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                                                >
                                                    <Download size={14} />
                                                    {t('dashboard.bookings.receipt')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Calendar className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-4">{t('dashboard.bookings.noBookings')}</h3>
                        <p className="text-gray-400 mb-8">{t('dashboard.bookings.startExploring')}</p>
                        <button
                            onClick={() => navigate('/cars')}
                            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-all duration-300"
                        >
                            {t('dashboard.bookings.browseCars')}
                        </button>
                    </div>
                )
            }
            <UserOrdersTable title={'Istoricul rezervarilor'} onOrderClick={handleOrderClick} onAddOrder={() => setShowAddOrderModal(true)} />

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                    setOrderNumber(undefined);
                }}
                order={selectedOrder}
                orderNumber={orderNumber}
            />


        </>

    );


}