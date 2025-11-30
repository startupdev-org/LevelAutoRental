// OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import { ArrowRight, Car, Check, Calendar } from 'lucide-react';
import { fetchFavoriteCarsFromStorage, getUserRentals as fetchUsersRentals } from '../../../../lib/db/rentals/rentals';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { TabType } from '../../UserDashboard';
import { Rental } from '../../../../lib/orders';
import { FavoriteCar } from '../../../../types';
import FavoriteCarComponent from '../../../../components/dashboard/user-dashboard/overview/FavoriteCarComponent';

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

    const [favoriteCars, setFavoriteCars] = useState<FavoriteCar[]>([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function loadAll() {
            setLoading(true);

            await Promise.all([
                handleFetchUserRentals(),
                handleFetchUserFavoriteCars()
            ]);

            setLoading(false);
        }

        loadAll();
    }, []);


    async function handleFetchUserRentals() {
        const orders = await fetchUsersRentals();
        setRentals(orders);
    }

    async function handleFetchUserFavoriteCars() {
        const favoriteCars = await fetchFavoriteCarsFromStorage()
        setFavoriteCars(favoriteCars);
    }


    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    if (loading) {
        return (
            <LoadingState message="Se încarcă panoul de control..." />
        );
    }


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.overview.title')}</h2>
            </div>



            {/* Current Rentals Status */}
            <div className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Active Rental or No Current Rentals State */}
                    {rentals && rentals.filter(r => r.rental_status === 'ACTIVE' || r.rental_status === 'CONTRACT').length > 0 ? (
                        // Show active rental
                        (() => {
                            const activeRental = rentals.filter(r => r.rental_status === 'ACTIVE' || r.rental_status === 'CONTRACT')[0];
                            const isActive = activeRental.rental_status === 'ACTIVE';
                            return (
                                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-[0.03]">
                                        <div className="absolute inset-0" style={{
                                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.3) 1px, transparent 0)',
                                            backgroundSize: '20px 20px'
                                        }} />
                                    </div>

                                    {/* Car Image - Hero Style */}
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={activeRental.car?.image_url || '/placeholder-car.jpg'}
                                            alt={activeRental.car?.make}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                        {/* Car Info Overlay */}
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <h3 className="text-white font-bold text-base truncate mb-1">
                                                {activeRental.car?.make} {activeRental.car?.model}
                                            </h3>
                                            <p className="text-white/80 text-xs">
                                                {formatDate(activeRental.start_date)} - {formatDate(activeRental.end_date)}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white border border-blue-400/50 backdrop-blur-sm">
                                                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                                                <span>{isActive ? 'Activă' : 'Contract'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="p-3">
                                        <button
                                            onClick={() => setActiveTab('overview')}
                                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-md hover:shadow-lg"
                                        >
                                            <span>Vezi detalii</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        // No Current Rentals State
                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 min-h-[140px] flex items-center justify-center">
                            <div className="text-center p-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
                                    <Car className="text-blue-400" size={20} />
                                </div>
                                <h4 className="text-white font-medium mb-2 text-base">Nicio închiriere activă</h4>
                                <p className="text-blue-100 text-xs mb-3 max-w-xs">
                                    Începe să explorezi ofertele noastre!
                                </p>
                                <button
                                    onClick={() => setActiveTab('cars')}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-md hover:shadow-lg"
                                >
                                    <span>Închiriază acum</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Promotion/Info Card */}
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 transition-all duration-500 min-h-[140px] flex items-center justify-center">
                        <div className="text-center p-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
                                <span className="text-xl">🎁</span>
                            </div>
                            <h4 className="text-white font-medium mb-2 text-base">Ofertă Specială</h4>
                            <p className="text-gray-300 text-xs mb-3 max-w-xs">
                                Reduceri până la 20% pentru închirieri de weekend
                            </p>
                            <button
                                onClick={() => setActiveTab('cars')}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 py-1.5 rounded-md transition-all duration-300 text-white text-xs font-medium"
                            >
                                <span>Află mai mult</span>
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Past Rentals */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Rental History</h3>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className="text-gray-400 hover:text-gray-300 transition-colors duration-300 text-sm font-medium hover:underline"
                    >
                        Vezi toate
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {rentals && rentals.length > 0 ? (
                    rentals
                        .filter(rental => rental.rental_status === 'COMPLETED')
                        .slice(0, 6)
                        .map((rental) => (
                            <div
                                key={rental.id}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-[0.03]">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                    }} />
                                </div>

                        {/* Car Image - Hero Style */}
                        <div className="relative h-40 overflow-hidden">
                                    <img
                                        src={rental.car?.image_url || '/placeholder-car.jpg'}
                                        alt={rental.car?.make}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Car Info Overlay */}
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <h3 className="text-white font-bold text-base truncate mb-1">
                                            {rental.car?.make} {rental.car?.model}
                                        </h3>
                                        <p className="text-white/80 text-xs">
                                            {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/90 text-white border border-gray-400/50 backdrop-blur-sm">
                                            <Check className="w-3 h-3" />
                                            <span>Finalizată</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="p-3">
                                    <button
                                        onClick={() => setActiveTab('cars')}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        title="Închiriază această mașină din nou"
                                    >
                                        <ArrowRight size={14} />
                                        <span>Închiriază din nou</span>
                                    </button>
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                            <Calendar className="text-gray-400" size={32} />
                        </div>
                        <h4 className="text-gray-300 font-medium mb-3 text-lg">Nu ai închirieri finalizate încă</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                            Închirierile tale finalizate vor apărea aici
                        </p>
                        <button
                            onClick={() => setActiveTab('cars')}
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <span>Explorează mașini</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>



            {/* Favorite Cars Section */}
            <div className="mt-8">
                <FavoriteCarComponent favoriteCars={favoriteCars} />
            </div>

        </div>
    );
};
