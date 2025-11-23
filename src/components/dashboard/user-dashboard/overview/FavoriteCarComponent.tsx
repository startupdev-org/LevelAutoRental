import React from "react";
import { FavoriteCar } from '../../../../types';
import { ArrowRight, Star } from "lucide-react";

interface FavoriteCarComponentProps {
    favoriteCar?: FavoriteCar | null;
}

import { useTranslation } from 'react-i18next';

export default function FavoriteCarComponent({ favoriteCar }: FavoriteCarComponentProps) {
    const { t } = useTranslation();
    
    if (!favoriteCar || !favoriteCar.car) {
        return (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{t('dashboard.overview.favoriteCar')}</h3>
                </div>
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-gray-400" size={24} />
                    </div>
                    <h4 className="text-gray-300 font-medium mb-2">No favorite car yet</h4>
                    <p className="text-gray-400 text-sm mb-4">
                        {t('dashboard.overview.noFavoriteCar')}
                    </p>
                    <button
                        onClick={() => window.location.href = '/cars'}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300 text-sm text-white"
                    >
                        <span>{t('dashboard.overview.startBorrowing')}</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{t('dashboard.overview.favoriteCar')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Car Details + Button */}
                <div className="flex flex-col gap-4 text-gray-300">
                    <div>
                        <p className="text-sm mb-1">
                            <span className="font-semibold text-white">Make:</span> {favoriteCar.car.make}
                        </p>
                        <p className="text-sm mb-1">
                            <span className="font-semibold text-white">Model:</span> {favoriteCar.car.model}
                        </p>
                        <p className="text-sm">
                            <span className="font-semibold text-white">Year:</span> {favoriteCar.car.year}
                        </p>
                    </div>
                    <div className="mt-2">
                        <button
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300 text-sm text-white"
                        >
                            <span>Borrow</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Car Image */}
                <div className="flex justify-center md:justify-end">
                    {favoriteCar.car.image_url ? (
                        <img
                            src={favoriteCar.car.image_url}
                            alt="Favorite car"
                            className="w-full max-w-sm h-auto rounded-lg object-contain bg-black/10"
                        />
                    ) : (
                        <div className="text-gray-500 text-sm">No image available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
