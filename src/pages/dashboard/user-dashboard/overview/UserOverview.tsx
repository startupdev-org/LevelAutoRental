// OverviewTab.tsx
import React, { useEffect, useState } from 'react';
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

    const getStatusColor = (status?: string) => {
        if (!status) {
            return 'bg-gray-500/20 text-gray-400';
        }

        const lowerCaseStatus = status.toLowerCase();

        switch (lowerCaseStatus) {
            case 'upcoming':
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'active':
                return 'bg-green-500/20 text-green-400';
            case 'completed':
                return 'bg-gray-500/20 text-gray-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status?: string) => {
        if (!status) return <FileText className="w-3 h-3" />;
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.overview.title')}</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <BasicInfoComponent rentals={rentals} t={t} />
            </div>

            {/* Favorite Car */}
            <div className="mb-8">
                <FavoriteCarComponent favoriteCar={favoriteCar} />
            </div>

            {/* Recent Bookings */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{t('dashboard.overview.recentBookings')}</h3>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className="text-red-600 hover:text-red-500 transition-colors duration-300 text-sm font-medium"
                    >
                        {t('dashboard.overview.viewAll')}
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {recentRentals && recentRentals.length > 0 ? (
                        recentRentals.slice(0, 2).map((rental) => (
                            <div
                                key={rental.id}
                                className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                            >
                                {/* Car Image */}
                                <img
                                    src={rental.car?.image_url || '/placeholder-car.jpg'}
                                    alt={rental.car?.make}
                                    className="w-14 h-14 rounded-lg object-cover"
                                    loading="lazy"
                                />

                                {/* Car Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-sm text-white truncate">
                                                {rental.car?.make} {rental.car?.model}
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                                {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            {rental.total_amount && (
                                                <span className="text-red-600 font-bold text-base mr-2 block">
                                                    {rental.total_amount} MDL
                                                </span>
                                            )}
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(rental.rental_status)}`}>
                                                {getStatusIcon(rental.rental_status)}
                                                <span className="capitalize">{rental.rental_status?.toLowerCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="text-gray-400" size={24} />
                            </div>
                            <h4 className="text-gray-300 font-medium mb-2">No bookings yet</h4>
                            <p className="text-gray-400 text-sm mb-4">Start renting to see your booking history here</p>
                            <button
                                onClick={() => setActiveTab('cars')}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300 text-sm text-white"
                            >
                                <Calendar size={16} />
                                Browse Cars
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
