import { FileText, CheckCircle2, ChevronDown, User, Calendar, Gauge, IdCard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContractSectionProps {
    transparent?: boolean;
}

export const ContractSection: React.FC<ContractSectionProps> = ({ transparent = false }) => {
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <div className={`mt-8 rounded-2xl border shadow-sm p-6 md:p-8 mb-8 ${transparent ? 'bg-white/10 backdrop-blur-md border-white/20' : 'bg-white border-gray-300'}`}>
                {/* Section Header */}
                <div className="mb-8">
                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                        {t('contract.sectionLabel')}
                    </span>
                    <h2 className={`mt-3 text-3xl font-bold leading-tight ${transparent ? 'text-white' : 'text-gray-800'}`}>
                        {t('contract.sectionTitle')}
                    </h2>
                    <p className={`mt-4 text-sm leading-relaxed max-w-4xl ${transparent ? 'text-gray-200' : 'text-gray-500'}`}>
                        {t('contract.description')}
                    </p>
                </div>

                {/* Requirements Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>
                            {t('contract.requirementsTitle')}
                        </h3>
                    </div>
                    <p className={`mt-4 text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-500'}`}>
                        {t('contract.requirementsDescription')}
                    </p>
                </div>

                {/* Main Requirements - Highlighted */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>{t('contract.age.label')}</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>{t('contract.age.value')}</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <IdCard className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>{t('contract.license.label')}</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>{t('contract.license.value')}</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>{t('contract.experience.label')}</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>{t('contract.experience.value')}</div>
                    </div>

                    <div className={`text-center rounded-xl border p-5 hover:shadow-lg transition-all ${transparent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-gray-300'}`}>
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600">
                            <Gauge className="w-6 h-6 text-white" />
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${transparent ? 'text-gray-300' : 'text-gray-500'}`}>{t('contract.mileage.label')}</div>
                        <div className={`text-base font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>{t('contract.mileage.value')}</div>
                    </div>
                </div>

                {/* More Details - Collapsible */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${transparent ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
                    >
                        <span className={`text-sm font-semibold ${transparent ? 'text-white' : 'text-gray-800'}`}>{t('contract.moreDetails')}</span>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showMoreDetails ? 'rotate-180' : ''} ${transparent ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>

                    {showMoreDetails && (
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.identityCard')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.fullPayment')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.finesResponsibility')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.cascoResponsibility')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.paymentMethods')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.earlyReturn')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>{t('contract.details.extension')}</span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    {t('contract.details.delivery').replace('+373 62 000 112', '')}
                                    <a href="tel:+37362000112" className="text-red-500 font-semibold hover:underline">+373 62 000 112</a>.
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">{t('contract.details.deposit.title')}:</span> {t('contract.details.deposit.description')}
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">{t('contract.details.mileageLimit.title')}:</span> {t('contract.details.mileageLimit.description')}
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">{t('contract.details.secondDriver.title')}:</span> {t('contract.details.secondDriver.description')}
                                </span>
                            </div>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border md:col-span-2 ${transparent ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'}`}>
                                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm leading-relaxed ${transparent ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <span className="font-semibold">{t('contract.details.depositReturn.title')}:</span> {t('contract.details.depositReturn.description')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
