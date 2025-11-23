import { FileText, CheckCircle2, ChevronDown, User, Calendar, Gauge, IdCard } from 'lucide-react';
import { useState } from 'react';

export const ContractSection: React.FC = () => {
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    return (
        <>
            <div className="mt-8 bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-8">
                {/* Section Header */}
                <div className="mb-8">
                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                        Informații Legale
                    </span>
                    <h2 className="mt-3 text-3xl font-bold text-gray-800 leading-tight">
                        Contract
                    </h2>
                    <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-4xl">
                        Compania noastră oferă servicii de închiriere auto pe teritoriul Republicii Moldova, respectând cu strictețe legislația în vigoare. Interacțiunea cu clienții se bazează pe Contractul de închiriere, care garantează protecția juridică a intereselor acestora.
                    </p>
                </div>

                {/* Requirements Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                            Condiții și cerințe
                        </h3>
                    </div>
                    <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                        Pentru a închiria o mașină, trebuie îndeplinite următoarele cerințe:
                    </p>
                </div>

                {/* Main Requirements - Highlighted */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vârstă</div>
                        <div className="text-base font-bold text-gray-800">de la 21 de ani</div>
                    </div>

                    <div className="text-center bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <IdCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permis</div>
                        <div className="text-base font-bold text-gray-800">categoria B</div>
                    </div>

                    <div className="text-center bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experiență</div>
                        <div className="text-base font-bold text-gray-800">cel puțin 3 ani</div>
                    </div>

                    <div className="text-center bg-white rounded-xl border border-gray-300 p-5 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Gauge className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">km/zi</div>
                        <div className="text-base font-bold text-gray-800">până la 200km</div>
                    </div>
                </div>

                {/* More Details - Collapsible */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-300 transition-all group"
                    >
                        <span className="text-sm font-semibold text-gray-800">Mai Multe Detalii</span>
                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${showMoreDetails ? 'rotate-180' : ''}`} />
                    </button>

                    {showMoreDetails && (
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Deținerea buletinului de identitate.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Achitarea integrală (100%) a taxei de închiriere pentru mașina selectată.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Toate amenzile primite în timpul utilizării vehiculului revin în responsabilitatea șoferului.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">În lipsa poliței CASCO, responsabilitatea pentru accidente revine șoferului.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Plata se poate efectua în numerar, prin transfer bancar sau cu cardul.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Clientul are dreptul la recalcularea costului în caz de returnare anticipată a vehiculului.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">Prelungirea Contractului de închiriere este posibilă în format la distanță, dar nu este garantată.</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    Este posibilă livrarea sau returnarea mașinii la adresa convenabilă. Costul se confirmă la telefon{' '}
                                    <a href="tel:+37379752222" className="text-red-500 font-semibold hover:underline">+373 79 75-22-22</a>.
                                </span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300 md:col-span-2">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold">Depozit:</span> Depunerea unui depozit conform valorii stabilite în Contract. Depozitul reprezintă o asigurare a îndeplinirii obligațiilor de către Chiriaș și este returnat după 10 zile de la predarea mașinii, în absența încălcărilor majore.
                                </span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300 md:col-span-2">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold">Limita de kilometraj:</span> În cazul închirierii pentru mai multe zile, limita se calculează în total. În cazul depășirii limitei și în lipsa opțiunii activate «Kilometraj nelimitat», depășirea se achită separat.
                                </span>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-300 md:col-span-2">
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold">Al doilea șofer:</span> Înainte de semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 0 lei. După semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 500 lei.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
