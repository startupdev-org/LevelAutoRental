import { useTranslation } from "react-i18next"
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { UserOrdersTable } from '../../../../components/dashboard/user/orders/UsersOrdersTable';

import { Rental } from "../../../../lib/orders";
import { OrderDetailsModal } from "../../../../components/modals/OrderDetailsModal";
import { UserActiveOrdersTable } from "../../../../components/dashboard/user/orders/UserActiveOrdersTable";
import { fetchActiveRentals } from "../../../../lib/db/rentals/rentals";

export const UserOrdersSection: React.FC = () => {

    const { t } = useTranslation();

    const [selectedOrder, setSelectedOrder] = useState<Rental | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);

    const [activeRentals, setActiveRentals] = useState<Rental[] | null>(null);


    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    async function handleFetchActiveOrders() {
        const acitveRentals = await fetchActiveRentals();
        setActiveRentals(acitveRentals);

    }

    useEffect(() => {
        handleFetchActiveOrders();

    }, [])

    const handleOrderClick = (order: Rental) => {
        console.log('handling order click for order: ', order)
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.bookings.title')}</h2>
            </div> */}

            {/* Current Borrowed Cars */}
            <UserActiveOrdersTable orders={activeRentals} onOrderClick={handleOrderClick} />

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
            />
        </div>
    );


}