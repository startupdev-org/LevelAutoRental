import { useTranslation } from "react-i18next"
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { UserOrdersTable } from '../../../../components/dashboard/user/orders/UsersOrdersTable';

import { Rental } from "../../../../lib/orders";
import { OrderDetailsModal } from "../../../../components/modals/OrderDetailsModal";
import { UserActiveOrdersTable } from "../../../../components/dashboard/user/orders/UserActiveOrdersTable";
import { fetchActiveRentals } from "../../../../lib/db/rentals/rentals";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { RentalRequestModal } from "../../../../components/modals/RentalRequestModal";

export const UserOrdersSection: React.FC = () => {

    const { t } = useTranslation();

    const [selectedOrder, setSelectedOrder] = useState<Rental | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);

    const [activeRentals, setActiveRentals] = useState<Rental[] | null>(null);

    const [loading, setLoading] = useState(true);

    async function handleFetchActiveOrders() {
        const acitveRentals = await fetchActiveRentals();
        setActiveRentals(acitveRentals);

    }

    useEffect(() => {
        async function loadAll() {
            setLoading(true);

            await Promise.all([
                handleFetchActiveOrders()
            ]);

            setLoading(false);
        }

        loadAll()
    }, [])

    const handleOrderClick = (order: Rental) => {
        console.log('handling order click for order: ', order)
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <EmptyState
                icon={<div className="animate-spin border-4 border-gray-600 border-t-transparent rounded-full w-10 h-10"></div>}
                title="Loading your orders..."
                subtitle="Please wait while we your data is loading"
            />
        );
    }

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

            {/* <RentalRequestModal
                isOpen={false}
                // onClose={ }
                // car={undefined}
                pickupDate={""}
                returnDate={""}
                pickupTime={""}
                returnTime={""}
                rentalCalculation={null}
            /> */}
        </div>
    );


}