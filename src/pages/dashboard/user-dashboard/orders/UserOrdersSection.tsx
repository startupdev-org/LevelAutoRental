import { useTranslation } from "react-i18next"
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRight, Car, Check, Truck } from 'lucide-react';
import { OrderDetailsModal } from "../../../../components/modals/OrderDetailsModal";
import { getUserRentals as fetchUsersRentals } from "../../../../lib/db/rentals/rentals";
import { Rental } from "../../../../types";
import { formatDateLocal } from "../../../../utils/date";

export const UserOrdersSection: React.FC = () => {

    const { t } = useTranslation();

    const [rentals, setRentals] = useState<Rental[] | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Rental | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function loadRentals() {
            const orders = await fetchUsersRentals();
            setRentals(orders);
        }
        loadRentals();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.bookings.title') || 'Rezervările mele'}</h2>
            </div>

            {/* Current Rentals Status */}
            <div className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Active Rental or No Current Rentals State */}
                    {rentals && rentals.filter(r => {
                        if (r.rental_status !== 'ACTIVE' && r.rental_status !== 'CONTRACT') return false;

                        // Check if end date hasn't passed
                        const now = new Date();
                        const endDateTime = new Date(r.end_date);

                        if (r.end_time) {
                            const [hours, minutes] = r.end_time.split(':').map(Number);
                            endDateTime.setHours(hours || 23, minutes || 59, 59, 999);
                        } else {
                            endDateTime.setHours(23, 59, 59, 999); // End of day
                        }

                        return now <= endDateTime;
                    }).length > 0 ? (
                        // Show active rental that hasn't ended yet
                        (() => {
                            const activeRentals = rentals.filter(r => {
                                if (r.rental_status !== 'ACTIVE' && r.rental_status !== 'CONTRACT') return false;

                                // Check if end date hasn't passed
                                const now = new Date();
                                const endDateTime = new Date(r.end_date);

                                if (r.end_time) {
                                    const [hours, minutes] = r.end_time.split(':').map(Number);
                                    endDateTime.setHours(hours || 23, minutes || 59, 59, 999);
                                } else {
                                    endDateTime.setHours(23, 59, 59, 999); // End of day
                                }

                                return now <= endDateTime;
                            });
                            const activeRental = activeRentals[0];
                            const isActive = activeRental.rental_status === 'ACTIVE';

                            // Check if current date/time is between start and end date/time
                            const now = new Date();

                            const rentalStartDateTime = new Date(activeRental.start_date);
                            if (activeRental.start_time) {
                                const [hours, minutes] = activeRental.start_time.split(':').map(Number);
                                rentalStartDateTime.setHours(hours || 0, minutes || 0, 0, 0);
                            } else {
                                rentalStartDateTime.setHours(0, 0, 0, 0); // Start of day if no time
                            }

                            const rentalEndDateTime = new Date(activeRental.end_date);
                            if (activeRental.end_time) {
                                const [hours, minutes] = activeRental.end_time.split(':').map(Number);
                                rentalEndDateTime.setHours(hours || 23, minutes || 59, 59, 999);
                            } else {
                                rentalEndDateTime.setHours(23, 59, 59, 999); // End of day if no time
                            }

                            const isStarted = now >= rentalStartDateTime && now <= rentalEndDateTime;
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
                                                {formatDateLocal(activeRental.start_date)} {activeRental.start_time ? `la ${activeRental.start_time.slice(0, 5)}` : ''} - {formatDateLocal(activeRental.end_date)} {activeRental.end_time ? `la ${activeRental.end_time.slice(0, 5)}` : ''}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white border border-blue-400/50 backdrop-blur-sm">
                                                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                                                <span>
                                                    {isActive && isStarted ? 'Început' :
                                                     isActive ? 'Activă' : 'Contract'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="p-3">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(activeRental);
                                                setIsModalOpen(true);
                                            }}
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
                                    onClick={() => window.location.href = '/cars'}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3 py-1.5 rounded-md transition-all duration-300 text-white text-xs font-medium"
                                >
                                    <span>Închiriază acum</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Promotion Card */}
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
                                onClick={() => window.location.href = '/cars'}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 py-1.5 rounded-md transition-all duration-300 text-white text-xs font-medium"
                            >
                                <span>Află mai mult</span>
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rental History */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Rental History</h3>
                <button
                    onClick={() => window.location.href = '/dashboard?tab=bookings'}
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
                                            {formatDateLocal(rental.start_date)} {rental.start_time ? `la ${rental.start_time.slice(0, 5)}` : ''} - {formatDateLocal(rental.end_date)} {rental.end_time ? `la ${rental.end_time.slice(0, 5)}` : ''}
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
                                        onClick={() => window.location.href = '/cars'}
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
                            <Check className="text-gray-400" size={32} />
                        </div>
                        <h4 className="text-gray-300 font-medium mb-3 text-lg">Nu ai închirieri finalizate încă</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                            Închirierile tale finalizate vor apărea aici
                        </p>
                        <button
                            onClick={() => window.location.href = '/cars'}
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <span>Explorează mașini</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                    setOrderNumber(undefined);
                }}
                order={selectedOrder}
                showOrderNumber={false}
            />

        </div>
    );


}