import React, { useState, useEffect } from "react";
import { Car } from "../../../../types";
import { Loader2 } from "lucide-react";
import { LoadingState } from "../../../ui/LoadingState";

// Car Details/Edit View Component
interface CarDetailsViewProps {
    car: Car;
    onCancel: () => void;
}

export const CarDetailsView: React.FC<CarDetailsViewProps> = ({ car, onCancel: onExit }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true); // loading state
    const [fullCar, setFullCar] = useState<Car | null>(null);

    const mainImage = selectedIndex !== null
        ? fullCar?.photo_gallery?.[selectedIndex]
        : fullCar?.photo_gallery?.[0];

    // simulate fetching full car details
    useEffect(() => {
        async function fetchFullCar() {
            setLoading(true);
            try {
                await new Promise(res => setTimeout(res, 500));
                setFullCar(car);
            } finally {
                setLoading(false);
            }
        }

        fetchFullCar();
    }, [car]);

    if (loading || !fullCar) {
        return <LoadingState message="Loading car details..." />;
    }

    return (
        <div className="space-y-6">
            <form className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Car Name</label>
                            <input
                                type="text"
                                value={(fullCar.make || '') + ' ' + (fullCar.model || '')}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                <input
                                    type="number"
                                    value={fullCar.year || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Seats</label>
                                <input
                                    type="number"
                                    value={fullCar.seats || ''}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <input
                                value={fullCar.category || 'luxury'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price Per Day (MDL)</label>
                            <input
                                type="number"
                                value={fullCar.price_per_day || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Body Type</label>
                            <input
                                value={fullCar.body || 'Sedan'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Transmission</label>
                            <input
                                value={fullCar.transmission || 'Automatic'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fuel Type</label>
                            <input
                                value={fullCar.fuel_type || 'gasoline'}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Drivetrain</label>
                            <input
                                type="text"
                                value={fullCar.drivetrain || ''}
                                readOnly
                                placeholder="e.g., AWD, RWD, FWD"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                {mainImage && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Photo Gallery</label>

                        <div className="w-full flex justify-center mb-4">
                            <img
                                src={mainImage}
                                alt="Selected car image"
                                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-lg border border-white/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {fullCar.photo_gallery?.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Gallery image ${index + 1}`}
                                    className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-cover rounded-lg border 
                                        ${selectedIndex === index ? "border-blue-500 ring-2 ring-blue-400" : "border-white/10"}`}
                                    onClick={() => setSelectedIndex(index)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                    <div className="flex flex-wrap gap-2">
                        {fullCar.features?.map((feature, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Status & Ratings */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Status & Ratings</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={fullCar.rating || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reviews Count</label>
                            <input
                                type="number"
                                value={fullCar.reviews || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={onExit}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                    >
                        Exit
                    </button>
                </div>
            </form>
        </div>
    );
};
