import { FileText, CheckCircle2, ChevronDown, User, Calendar, Gauge, IdCard } from 'lucide-react';
import { useState } from 'react';

interface ContractSectionProps {
    transparent?: boolean;
}

export const ContractSection: React.FC<ContractSectionProps> = ({ transparent = false }) => {
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    return (
        <>
            <div className={`mt-8 rounded-2xl border shadow-sm p-6 md:p-8 mb-8 ${transparent ? 'bg-white/10 backdrop-blur-md border-white/20' : 'bg-white border-gray-300'}`}>
                {/* Section Header */}
                <div className="mb-8">
                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                        Informații Legale
                    </span>
                    <h2 className={`mt-3 text-3xl font-bold leading-tight ${transparent ? 'text-white' : 'text-gray-800'}`}>
                        Contract
                    </h2>
                    <p className={`mt-4 text-sm leading-relaxed max-w-4xl ${transparent ? 'text-gray-200' : 'text-gray-500'}`}>
                        Compania noastră oferă servicii de închiriere auto pe teritoriul Republicii Moldova, respectând cu strictețe legislația în vigoare. Interacțiunea cu clienții se bazează pe Contractul de închiriere, care garantează protecția juridică a intereselor acestora.
                    </p>
                </div>

                {/* Requirements Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>
                            Condiții și cerințe
                        </h3>
                    </div>
                    <p className={`mt-4 text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-500'}`}>
                        Pentru a închiria o mașină, trebuie îndeplinite următoarele cerințe:
                    </p>
                </div>

                {/* Main Requirements - Highlighted */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>Vârstă</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>de la 21 de ani</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <IdCard className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>Permis</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>categoria B</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>Experiență</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>cel puțin 3 ani</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Gauge className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>km/zi</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>până la 200km</div>
                    </div>
                </div>

                {/* More Details - Collapsible */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${transparent ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
                    >
                        <span className={`text-sm font-semibold ${transparent ? 'text-white' : 'text-gray-800'}`}>Mai Multe Detalii</span>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showMoreDetails ? 'rotate-180' : ''} ${transparent ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>

                    {showMoreDetails && (
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Deținerea buletinului de identitate.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Achitarea integrală (100%) a taxei de închiriere pentru mașina selectată.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Toate amenzile primite în timpul utilizării vehiculului revin în responsabilitatea șoferului.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>În lipsa poliței CASCO, responsabilitatea pentru accidente revine șoferului.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Plata se poate efectua în numerar, prin transfer bancar sau cu cardul.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Clientul are dreptul la recalcularea costului în caz de returnare anticipată a vehiculului.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>Prelungirea Contractului de închiriere este posibilă în format la distanță, dar nu este garantată.</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Este posibilă livrarea sau returnarea mașinii la adresa convenabilă. Costul se confirmă la telefon{' '}
                                    <a href="tel:+37362000112" className="text-red-500 font-semibold hover:underline">+373 62 000 112</a>.
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">Depozit:</span> Depunerea unui depozit conform valorii stabilite în Contract. Depozitul reprezintă o asigurare a îndeplinirii obligațiilor de către Chiriaș și este returnat după 10 zile de la predarea mașinii, în absența încălcărilor majore.
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">Limita de kilometraj:</span> În cazul închirierii pentru mai multe zile, limita se calculează în total. În cazul depășirii limitei și în lipsa opțiunii activate «Kilometraj nelimitat», depășirea se achită separat.
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">Al doilea șofer:</span> Înainte de semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 0 lei. După semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 500 lei.
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">Returnarea depozitului:</span> Dacă depozitul este lăsat cash, se returnează la predarea automobilului. Dacă este reținut de pe card, returnarea are loc în termen de 10 zile lucrătoare după predarea automobilului.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
