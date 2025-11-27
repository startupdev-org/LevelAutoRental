import React from 'react';
import { Calendar, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Rental } from '../../../../lib/orders';
import { useTranslation } from 'react-i18next';

interface Props {
    orders: Rental[] | null;
    onOrderClick: (order: Rental) => void;
}

export const UserActiveOrdersTable: React.FC<Props> = ({ orders, onOrderClick }) => {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    if (orders! && orders?.length === 0) {
        return (<></>);
    }

    const activeOrders =
        orders !== null ?
            orders.filter((order) => order.rental_status.toLowerCase() === 'active')
            : [];

    return (
        <div className="space-y-4">
            {/* Box container for title + orders */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-6">
                {/* Title inside the box */}
                <h2 className="text-xl sm:text-3xl font-bold text-white">
                    Rezervari active
                </h2>

                {/* Active orders */}
                {activeOrders.length > 0 ? (
                    activeOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={order.car?.image_url || ''}
                                    alt={(order.car?.id)?.toString()}
                                    className="w-24 h-34 rounded-lg object-cover cursor-pointer"
                                    onClick={() => onOrderClick(order)}
                                />

                                <div className="flex-1">
                                    <h3 className="font-semibold text-white text-lg mb-2">
                                        {order.car?.make + ' ' + order.car?.model}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm font-semibold text-gray-400 mb-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {formatDate(order.start_date)} {order.start_time} -{' '}
                                            {formatDate(order.end_date)} {order.end_time}
                                        </span>
                                    </div>

                                    <div className="text-sm font-semibold text-gray-300 mb-2">
                                        <span className="font-semibold">Total:</span>{' '}
                                        {order.total_amount} MDL
                                    </div>
                                </div>

                                <div className="text-right flex flex-col gap-2">
                                    <button
                                        onClick={() => onOrderClick(order)}
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
                    ))
                ) : (
                    <p className="text-gray-400 text-center">Nu există rezervări active.</p>
                )}
            </div>
        </div>
    );

};
