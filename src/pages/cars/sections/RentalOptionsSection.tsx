import { Car, Gauge, Zap, UserRound, Star, Shield, Baby, Wifi, Wrench } from 'lucide-react';

export const RentalOptionsSection: React.FC = () => {
    return (
        <>
            <div className="mt-16 bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Opțiuni de închiriere</h2>

                <p className="text-gray-700 leading-relaxed mb-8">
                    O varietate de opțiuni disponibile pentru activare extinde semnificativ posibilitățile în cadrul închirierii unei mașini de la AUTOHUB. De exemplu, puteți activa asigurarea CASCO, care acoperă toate tipurile de daune ale vehiculului, iar prin activarea serviciului Priority Service beneficiați de procesare prioritară a documentelor și suport prioritar pe tot parcursul închirierii. De asemenea, sunt disponibile opțiuni precum: închirierea scaunelor auto pentru copii, asistență rutieră, livrare la adresa indicată și multe altele.
                </p>

                <div className="space-y-6">
                    {/* Delivery Option */}
                    <div className="border-l-4 border-theme-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                            <Car className="w-5 h-5 text-theme-500" />
                            Preluarea automobilului la adresa convenabilă pentru dvs./dumneavoastră
                        </h3>
                        <p className="text-gray-600 text-sm">Costul se calculează separat și depinde de locul livrării</p>
                    </div>

                    {/* Return Option */}
                    <div className="border-l-4 border-theme-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                            <Car className="w-5 h-5 text-theme-500" />
                            Returnarea mașinii la adresa convenabilă pentru dumneavoastră
                        </h3>
                        <p className="text-gray-600 text-sm">Prețul se negociază separat și depinde de locul returnării</p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                        {/* Unlimited KM */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                                    <Gauge className="w-5 h-5 text-theme-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Kilometraj nelimitat</h4>
                                    <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 50% mai mare</p>
                                </div>
                            </div>
                        </div>

                        {/* Speed Limit Increase */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-theme-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Creșterea limitei de viteză</h4>
                                    <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 20% mai mare</p>
                                </div>
                            </div>
                        </div>

                        {/* Personal Driver */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <UserRound className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Șofer personal</h4>
                                    <p className="text-gray-700 font-semibold text-sm">din 800 MDL pe zi</p>
                                </div>
                            </div>
                        </div>

                        {/* Priority Service */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Star className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Priority Service</h4>
                                    <p className="text-gray-700 font-semibold text-sm">din 1000 MDL pe zi</p>
                                </div>
                            </div>
                        </div>

                        {/* Tire Insurance */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-theme-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Asigurare pentru anvelope și parbriz</h4>
                                    <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 20% mai mare</p>
                                </div>
                            </div>
                        </div>

                        {/* Child Seat */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Baby className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Scaun auto pentru copii</h4>
                                    <p className="text-gray-700 font-semibold text-sm">din 100 MDL pe zi</p>
                                </div>
                            </div>
                        </div>

                        {/* SIM Card */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Wifi className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Cartelă SIM cu internet</h4>
                                    <p className="text-gray-700 font-semibold text-sm">din 100 MDL pe zi</p>
                                </div>
                            </div>
                        </div>

                        {/* Roadside Assistance */}
                        <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Asistență rutieră</h4>
                                    <p className="text-gray-700 font-semibold text-sm">din 500 MDL pe zi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
