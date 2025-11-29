// OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Truck, Check, Clock, FileText, ArrowRight } from 'lucide-react';
import { fetchFavoriteCarsFromStorage, fetchRecentRentals, getUserRentals as fetchUsersRentals } from '../../../../lib/db/rentals/rentals';
import { fetchCLSImage } from '../../../../lib/db/cars/cars';
import { OrderDetailsModal } from '../../../../components/modals/OrderDetailsModal';
import { TabType } from '../../UserDashboard';
import { Rental } from '../../../../lib/orders';
import { FavoriteCar } from '../../../../types';
import FavoriteCarComponent from '../../../../components/dashboard/user-dashboard/overview/FavoriteCarComponent';
import { EmptyState } from '../../../../components/ui/EmptyState';

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

    const [favoriteCars, setFavoriteCars] = useState<FavoriteCar[]>([]);
    const [clsImageUrl, setClsImageUrl] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Rental | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    // Fetch CLS image for testing
    useEffect(() => {
        const fetchCLS = async () => {
            try {
                console.log('🔍 Fetching CLS image from Supabase...');
                const imageUrl = await fetchCLSImage();
                console.log('✅ CLS Image URL:', imageUrl);
                setClsImageUrl(imageUrl);
            } catch (error) {
                console.error('❌ Error fetching CLS image:', error);
            }
        };
        fetchCLS();
    }, []);

    // Handle opening order details modal
    const handleOrderDetails = (order: Rental) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    useEffect(() => {
        async function loadAll() {
            setLoading(true);

            await Promise.all([
                handleFetchUserRentals(),
                handleFetchUserFavoriteCars(),
                handleFetchUserRecentRentals()
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

    if (loading) {
        return (
            <EmptyState
                icon={<div className="animate-spin border-4 border-gray-600 border-t-transparent rounded-full w-10 h-10"></div>}
                title="Loading your overview..."
                subtitle="Please wait while we your data is loading"
            />
        );
    }


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.overview.title')}</h2>
            </div>


            {/* Current Rentals Section - Mock for testing */}
            <div className="mt-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mock Current Rental - Mercedes CLS */}
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
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
                                src={clsImageUrl || '/placeholder-car.jpg'}
                                alt="Mercedes CLS"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder-car.jpg';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Car Info Overlay */}
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white font-bold text-base truncate mb-1">
                                    Mercedes CLS
                                </h3>
                                <p className="text-white/80 text-xs">
                                    {formatDate(new Date().toISOString())} - {formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white border border-blue-400/50 backdrop-blur-sm">
                                    <span>Inchiriere Activa</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="p-3">
                            <button
                                onClick={() => handleOrderDetails({
                                    id: 'mock-current-123',
                                    car: {
                                        id: 999,
                                        make: 'Mercedes',
                                        model: 'CLS',
                                        image_url: clsImageUrl || '/placeholder-car.jpg',
                                        price_per_day: 85
                                    },
                                    start_date: new Date().toISOString(),
                                    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                                    rental_status: 'ACTIVE',
                                    user_id: '',
                                    car_id: 999,
                                    total_amount: 255,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                title="Vezi detalii rezervare activă"
                            >
                                <FileText size={14} />
                                <span>Detalii</span>
                            </button>
                        </div>
                    </div>

                    {/* Empty State for Additional Current Rentals */}
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 border-dashed hover:border-white/30 transition-all duration-500 min-h-[200px] flex items-center justify-center">
                        <div className="text-center p-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                                <Truck className="text-blue-400" size={20} />
                            </div>
                            <h4 className="text-gray-300 font-medium mb-2 text-sm">Nicio altă închiriere activă</h4>
                            <p className="text-gray-400 text-xs mb-3">
                                Ai o închiriere activă
                            </p>
                            <button
                                onClick={() => setActiveTab('cars')}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3 py-1.5 rounded-md transition-all duration-300 text-white text-xs font-medium"
                            >
                                <span>Închiriază alta</span>
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
                        onClick={() => setActiveTab('bookings')}
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

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    order={selectedOrder}
                    orderNumber={selectedOrder.id ? parseInt(selectedOrder.id.split('-').pop() || '1') : 1}
                />
            )}
        </div>
    );
};
