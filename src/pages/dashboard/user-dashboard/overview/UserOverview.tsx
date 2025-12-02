// OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import { ArrowRight, Car, Check, Calendar, Eye } from 'lucide-react';
import { fetchFavoriteCarsFromStorage, getUserBorrowRequests as fetchUserBorrowRequests } from '../../../../lib/db/rentals/rentals';
import { supabase } from '../../../../lib/supabase';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { TabType } from '../../UserDashboard';
import { BorrowRequest } from '../../../../lib/orders';
import { FavoriteCar } from '../../../../types';
import FavoriteCarComponent from '../../../../components/dashboard/user-dashboard/overview/FavoriteCarComponent';
import { OrderDetailsModal } from '../../../../components/modals/OrderDetailsModal';

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

    const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[] | null>(null);

    const [favoriteCars, setFavoriteCars] = useState<FavoriteCar[]>([]);

    const [loading, setLoading] = useState(true);

    // Modal state for order details
    const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Convert BorrowRequest to OrderDisplay format for modal compatibility
    const convertBorrowRequestToOrderDisplay = (request: BorrowRequest): any => {
        const startDate = new Date(request.start_date || new Date());
        const endDate = new Date(request.end_date || new Date());
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const amount = request.car ? ((request.car as any)?.pricePerDay || request.car.price_per_day || 0) * days : 0;

        return {
            id: request.id,
            type: 'request',
            customerName: (request as any).customer_name ||
                ((request as any).customer_first_name && (request as any).customer_last_name ?
                    `${(request as any).customer_first_name} ${(request as any).customer_last_name}` : ''),
            customerEmail: (request as any).customer_email || request.user_id,
            customerPhone: (request as any).customer_phone || '',
            customerFirstName: (request as any).customer_first_name || '',
            customerLastName: (request as any).customer_last_name || '',
            customerAge: (request as any).customer_age || undefined,
            carName: request.car ? `${request.car.make} ${request.car.model}` : 'Unknown Car',
            avatar: request.car?.image_url || '',
            pickupDate: request.start_date ? new Date(request.start_date).toISOString().split('T')[0] : '',
            pickupTime: request.start_time || '09:00',
            returnDate: request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : '',
            returnTime: request.end_time || '17:00',
            status: request.status,
            amount: amount,
            total_amount: amount.toString(),
            carId: request.car_id.toString(),
            userId: request.user_id,
            createdAt: request.created_at,
            features: request.car?.features || [],
            options: (request as any).options || {},
        };
    };


    useEffect(() => {
        async function loadAll() {
            setLoading(true);

            await Promise.all([
                handleFetchUserBorrowRequests(),
                handleFetchUserFavoriteCars()
            ]);

            setLoading(false);
        }

        loadAll();

        // Set up polling to refresh borrow request data every 30 seconds
        // This ensures the UI updates when database triggers change borrow request status
        const interval = setInterval(() => {
            handleFetchUserBorrowRequests();
        }, 30000); // 30 seconds

        // Set up real-time subscription for borrow request changes
        const subscription = supabase
            .channel('borrow-request-updates')
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'BorrowRequest'
                },
                (payload) => {
                    console.log('Borrow request updated:', payload);
                    // Refresh borrow request data when any borrow request is updated
                    handleFetchUserBorrowRequests();
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(subscription);
        };
    }, []);


    async function handleFetchUserBorrowRequests() {
        const requests = await fetchUserBorrowRequests();
        setBorrowRequests(requests);
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ pointerEvents: 'auto' }}>
                    {/* Current Active Borrow Requests or No Current Requests State */}
                    {borrowRequests && borrowRequests.filter(r => r.status === 'APPROVED' || r.status === 'EXECUTED').length > 0 ? (
                        // Show all active borrow requests
                        borrowRequests
                            .filter(r => r.status === 'APPROVED' || r.status === 'EXECUTED')
                            .map((activeRequest) => {
                                const getStatusInfo = (status: string) => {
                                    switch (status) {
                                        case 'EXECUTED':
                                            return { text: 'Început', color: 'bg-blue-500/90 text-blue-100 border-blue-400/50' };
                                        case 'APPROVED':
                                        default:
                                            return { text: 'Aprobat', color: 'bg-emerald-500/90 text-emerald-100 border-emerald-400/50' };
                                    }
                                };
                                return (
                                    <div key={activeRequest.id} className="group relative rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl pointer-events-auto">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-[0.03] rounded-xl">
                                            <div className="absolute inset-0" style={{
                                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.3) 1px, transparent 0)',
                                                backgroundSize: '20px 20px'
                                            }} />
                                        </div>

                                        {/* Car Image - Hero Style */}
                                        <div className="relative h-40 overflow-hidden rounded-t-xl">
                                            <img
                                                src={activeRequest.car?.image_url || '/placeholder-car.jpg'}
                                                alt={activeRequest.car?.make}
                                                className="w-full h-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                            {/* Car Info Overlay */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-white font-bold text-base truncate mb-1">
                                                    {activeRequest.car?.make} {activeRequest.car?.model}
                                                </h3>
                                                <p className="text-white/80 text-xs">
                                                    {formatDate(activeRequest.start_date)} - {formatDate(activeRequest.end_date)}
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusInfo(activeRequest.status).color}`}>
                                                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                                <span>{getStatusInfo(activeRequest.status).text}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button - Inside card but outside overflow container */}
                                    <div className="p-3 bg-transparent relative z-10" style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
                                        <div style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(activeRequest);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-md hover:shadow-lg"
                                                style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto', cursor: 'pointer' }}
                                            >
                                                <span>Vezi detalii</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })
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

            {/* Past Borrow Requests */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Request History</h3>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className="text-gray-400 hover:text-gray-300 transition-colors duration-300 text-sm font-medium hover:underline"
                    >
                        Vezi toate
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {borrowRequests && borrowRequests.length > 0 ? (
                    borrowRequests
                        .filter(request => request.status === 'EXECUTED')
                        .slice(0, 6)
                        .map((request) => (
                            <div
                                key={request.id}
                                className="group relative rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-[0.03]">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                    }} />
                                </div>

                        {/* Car Image - Hero Style */}
                        <div className="relative h-40 overflow-hidden rounded-t-xl">
                                    <img
                                        src={request.car?.image_url || '/placeholder-car.jpg'}
                                        alt={request.car?.make}
                                        className="w-full h-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Car Info Overlay */}
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <h3 className="text-white font-bold text-base truncate mb-1">
                                            {request.car?.make} {request.car?.model}
                                        </h3>
                                        <p className="text-white/80 text-xs">
                                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
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

                                {/* Action Buttons */}
                                <div className="p-3 relative z-10">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('cars')}
                                            className="w-4/5 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-md hover:shadow-lg relative z-20"
                                            title="Închiriază această mașină din nou"
                                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                        >
                                            <ArrowRight size={14} />
                                            <span>Închiriază din nou</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(request);
                                                setIsModalOpen(true);
                                            }}
                                            className="w-1/5 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-3 py-2 rounded-lg transition-all duration-300 text-white text-sm font-semibold shadow-md hover:shadow-lg relative z-20"
                                            title="Vezi detalii închiriere"
                                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                            <Calendar className="text-gray-400" size={32} />
                        </div>
                        <h4 className="text-gray-300 font-medium mb-3 text-lg">Nu ai cereri finalizate încă</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                            Cererile tale finalizate vor apărea aici
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
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                }}
                order={selectedRequest ? convertBorrowRequestToOrderDisplay(selectedRequest) : null}
                showOrderNumber={false}
            />

        </div>
    );
};
