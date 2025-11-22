import React from "react";

import { FavoriteCar } from '../../../../types';

export default function FavoriteCarComponent({ favoriteCar }: { favoriteCar?: FavoriteCar | null }) {
    if (!favoriteCar || !favoriteCar.car) {
        return (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center text-gray-300">
                <h3 className="font-bold text-2xl mb-2 text-white">Favorite Car</h3>
                <p className="text-sm">You don't have a favorite car yet. Start borrowing to choose one!</p>
            </div>
        );
    }


    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-2xl mb-2">Favorite Car</h3>
            <div className="grid grid-cols-2 gap-4 items-start">
                <div className="flex flex-col gap-2 text-gray-300 text-sm">
                    <p><span className="font-semibold text-white">Make:</span> {favoriteCar.car.make}</p>
                    <p><span className="font-semibold text-white">Model:</span> {favoriteCar.car.model}</p>
                    <p><span className="font-semibold text-white">Year:</span> {favoriteCar.car.year}</p>
                </div>


                <div className="w-auto h-auto rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    {favoriteCar.car.image_url ? (
                        <img
                            src={favoriteCar.car.image_url}
                            alt="Favorite car"
                            className="w-40 h-30 rounded-lg"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-xs">No image</div>
                    )}
                </div>
            </div>
        </div>
    );
}