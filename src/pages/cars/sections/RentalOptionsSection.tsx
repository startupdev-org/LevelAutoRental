import { Car, Gauge, Zap, UserRound, Star, Baby, Wifi, Wrench, MapPin } from 'lucide-react';

export const RentalOptionsSection: React.FC = () => {
    return (
        <>
            <div className="mt-8 bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-8">
                {/* Section Header */}
                <div className="mb-8">
                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                        Servicii Suplimentare
                    </span>
                    <h2 className="mt-3 text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                        Opțiuni de închiriere
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Kilometraj nelimitat</h4>
                                <p className="text-red-600 font-medium text-xs">Prețul închirierii va fi cu 50% mai mare</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Șofer personal</h4>
                                <p className="text-gray-700 font-medium text-xs">de la 800 MDL pe zi</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Priority Service</h4>
                                <p className="text-gray-700 font-medium text-xs">de la 1000 MDL pe zi</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Scaun auto pentru copii</h4>
                                <p className="text-gray-700 font-medium text-xs">de la 100 MDL pe zi</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Cartelă SIM cu internet</h4>
                                <p className="text-gray-700 font-medium text-xs">de la 100 MDL pe zi</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Asistență rutieră</h4>
                                <p className="text-gray-700 font-medium text-xs">de la 500 MDL pe zi</p>
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
                                <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Livrare aeroport</h4>
                                <p className="text-green-600 font-medium text-xs">Gratuit</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
