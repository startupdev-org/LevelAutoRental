import { Car, Gauge, Zap, UserRound, Star, Baby, Wifi, Wrench, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RentalOptionsSection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <div className="mt-8 bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-8">
                {/* Section Header */}
                <div className="mb-8">
                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                        {t('rentalOptions.sectionLabel')}
                    </span>
                    <h2 className="mt-3 text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                        {t('rentalOptions.sectionTitle')}
                    </h2>
                </div>

                {/* Options Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Unlimited KM */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <Gauge className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.unlimitedMileage.title')}</h4>
                                <p className="text-red-600 font-medium text-xs">{t('rentalOptions.unlimitedMileage.description')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Driver */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <UserRound className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.personalDriver.title')}</h4>
                                <p className="text-gray-700 font-medium text-xs">{t('rentalOptions.personalDriver.price')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Priority Service */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.priorityService.title')}</h4>
                                <p className="text-gray-700 font-medium text-xs">{t('rentalOptions.priorityService.price')}</p>
                            </div>
                        </div>
                    </div>


                    {/* Child Seat */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <Baby className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.childCarSeat.title')}</h4>
                                <p className="text-gray-700 font-medium text-xs">{t('rentalOptions.childCarSeat.price')}</p>
                            </div>
                        </div>
                    </div>

                    {/* SIM Card */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <Wifi className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.simCard.title')}</h4>
                                <p className="text-gray-700 font-medium text-xs">{t('rentalOptions.simCard.price')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Roadside Assistance */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.roadsideAssistance.title')}</h4>
                                <p className="text-gray-700 font-medium text-xs">{t('rentalOptions.roadsideAssistance.price')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Airport Delivery */}
                    <div className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">{t('rentalOptions.airportDelivery.title')}</h4>
                                <p className="text-green-600 font-medium text-xs">{t('rentalOptions.airportDelivery.price')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
