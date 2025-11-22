// OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Star, Truck, Check, Clock, FileText, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchFavoriteCar, fetchRecentRentals, getUserRentals as fetchUsersRentals } from '../../../../lib/db/rentals/rentals';
import { TabType } from '../../UserDashboard';
import { Rental } from '../../../../lib/orders';
import { FavoriteCar } from '../../../../types';
import FavoriteCarComponent from '../../../../components/dashboard/user-dashboard/overview/FavoriteCarComponent';
import BasicInfoComponent from '../../../../components/dashboard/user-dashboard/overview/BasicInfoComponent';

export interface Booking {
    id: string;
    carName: string;
    carImage: string;
    startDate: string;
    endDate: string;
    status: string;
    totalPrice: number;
    pickupLocation: string;
}

interface OverviewTabProps {
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
    t: (key: string) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab, t }) => {

    const [rentals, setRentals] = useState<Rental[] | null>(null);
    const [recentRentals, setRecentRentals] = useState<Rental[] | null>(null);

    const [favoriteCar, setFavoriteCar] = useState<FavoriteCar | null>(null);

    useEffect(() => {
        handleFetchUserRentals()
        handleFetchUserFavoriteCar()
        handleFetchUserRecentRentals()
    }, [])

    async function handleFetchUserRentals() {
        const orders = await fetchUsersRentals();
        setRentals(orders);
    }

    async function handleFetchUserFavoriteCar() {
        const favoriteCar = await fetchFavoriteCar()
        setFavoriteCar(favoriteCar);
    }

    async function handleFetchUserRecentRentals() {
        const rentals = await fetchRecentRentals();
        setRecentRentals(rentals)

    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status?: Booking['status']) => {
        if (!status) {
            return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }

        const lowerCaseStatus = status.toLowerCase();

        switch (lowerCaseStatus) {
            case 'upcoming':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            case 'active':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'completed':
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status: Booking['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-3 h-3" />;
            case 'active':
                return <Truck className="w-3 h-3" />;
            case 'completed':
                return <Check className="w-3 h-3" />;
            default:
                return <FileText className="w-3 h-3" />;
        }
    };

    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('dashboard.overview.title')}</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <BasicInfoComponent rentals={rentals} t={t} />
                <FavoriteCarComponent favoriteCar={favoriteCar} />
            </div>

            {/* Recent Bookings */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-2xl sm:text-3xl font-bold">{t('dashboard.overview.recentBookings')}</h3>

                    <button
                        onClick={() => setActiveTab('bookings')}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg hover:border-green-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-lg font-semibold">{t('dashboard.overview.viewAll')}</span>
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {recentRentals?.map((rental) => (
                        <div
                            key={rental.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 shadow-sm"
                        >
                            {/* Car Image */}
                            <img
                                src={rental.car?.image_url || '/placeholder-car.jpg'}
                                alt={rental.car?.make}
                                className="w-full sm:w-40 h-40 sm:h-30 rounded-lg object-contain bg-black/10"
                                loading="lazy"
                            />

                            {/* Car Details */}
                            <div className="flex-1 flex flex-col justify-between gap-2 w-full">
                                <h4 className="font-bold text-white text-lg">
                                    {rental.car?.make} {rental.car?.model}
                                </h4>

                                <div className="flex flex-col sm:flex-row sm:gap-4 text-gray-300 text-sm">
                                    <p>
                                        <span className="font-semibold text-white">From:</span> {formatDate(rental.start_date)} {rental.start_time}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-white">To:</span> {formatDate(rental.end_date)} {rental.end_time}
                                    </p>
                                </div>

                                {rental.total_amount && (
                                    <p className="text-gray-300 text-sm mt-1">
                                        <span className="font-semibold text-white">Total price: </span>{rental.total_amount} MDL
                                    </p>
                                )}
                            </div>

                            {/* Status Badge */}
                            <button
                                className={`px-4 py-2 mt-2 sm:mt-0 ${getStatusColor(rental.rental_status)} font-semibold rounded-lg transition-all text-sm whitespace-nowrap flex items-center gap-2`}
                            >
                                <span className="capitalize">{rental.rental_status}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>

    );
};
