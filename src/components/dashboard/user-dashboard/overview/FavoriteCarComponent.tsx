import React from "react";
import { FavoriteCar } from '../../../../types';
import { ArrowRight } from "lucide-react";

interface FavoriteCarComponentProps {
    favoriteCar?: FavoriteCar | null;
}

export default function FavoriteCarComponent({ favoriteCar }: FavoriteCarComponentProps) {
    if (!favoriteCar || !favoriteCar.car) {
        return (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-gray-300 flex flex-col items-center gap-6">
                <h3 className="font-bold text-2xl sm:text-3xl mb-4 text-white">Favorite Car</h3>
                <p className="text-center text-lg sm:text-xl">
                    You haven't borrowed any car, so you don't have a favorite car yet.
                </p>
                <button
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg hover:border-green-500/60 transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                    <span className="text-lg sm:text-xl font-semibold">Start borrowing</span>
                    <ArrowRight className="w-5 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full">
            <h3 className="font-bold text-3xl sm:text-4xl mb-4 text-white">Favorite Car</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Car Details + Button */}
                <div className="flex flex-col gap-4 text-gray-300 text-lg sm:text-xl">
                    <p>
                        <span className="font-semibold text-white">Make:</span> {favoriteCar.car.make}
                    </p>
                    <p>
                        <span className="font-semibold text-white">Model:</span> {favoriteCar.car.model}
                    </p>
                    <p>
                        <span className="font-semibold text-white">Year:</span> {favoriteCar.car.year}
                    </p>
                    <div className="mt-2">
                        <button
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg hover:border-green-500/60 transition-all flex items-center gap-2 text-sm sm:text-base"
                        >
                            <span className="text-lg sm:text-xl font-semibold">Borrow</span>
                            <ArrowRight className="w-5 h-4" />
                        </button>
                    </div>
                </div>

                {/* Car Image */}
                <div className="flex justify-center md:justify-end">
                    {favoriteCar.car.image_url ? (
                        <img
                            src={favoriteCar.car.image_url}
                            alt="Favorite car"
                            className="w-3/4 sm:w-full max-w-sm h-auto rounded-lg object-contain bg-black/10"
                        />
                    ) : (
                        <div className="text-gray-500 text-sm">No image available</div>
                    )}
                </div>

            </div>
        </div>
    );
}
