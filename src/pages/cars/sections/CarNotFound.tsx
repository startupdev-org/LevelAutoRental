import { motion } from "framer-motion";
import { CarFront } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Car as CarType } from "../../../types/index"
import { useEffect, useState } from "react";
import { fetchCarsWithPhotos } from "../../../lib/db/cars/cars-page/cars";

const NUMBER_OF_CARS = 3;

export const CarNotFound: React.FC = () => {
    const navigate = useNavigate();

    const [cars, setCars] = useState<CarType[]>([]);

    async function handleFetchCarsWithPhotos() {
        try {
            const fetchedCars = await fetchCarsWithPhotos(NUMBER_OF_CARS);
            setCars(fetchedCars);
            //
        } catch (error) {
            console.error('Error fetching cars:', error);
        }
    }

    useEffect(() => {
        handleFetchCarsWithPhotos();
    }, []);

    return (
        <motion.div
            id="car-not-found" // used to identify the page
            className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            role="status"
            aria-live="polite"
        >
            <div className="max-w-4xl w-full">
                {/* Modern card design with glassmorphism effect */}
                <div className="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-theme-50/50 via-white/50 to-theme-100/50"></div>

                    {/* Content */}
                    <div className="relative z-10 p-8 md:p-12 text-center">
                        {/* Icon with modern design */}
                        <div className="mx-auto w-24 h-24 mb-8 relative">
                            <div className="w-full h-full rounded-full bg-gradient-to-r from-theme-500 to-theme-600 flex items-center justify-center shadow-lg">
                                <CarFront className="w-10 h-10 text-white" />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-theme-400 rounded-full animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-theme-300 rounded-full animate-pulse delay-150"></div>
                </div>

                {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Mașina nu a fost găsită
                </h2>

                {/* Description */}
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
                            Ne pare rău — nu am găsit o mașină cu acel ID. Poți reveni la lista completă de mașini sau încerca una din sugestiile de mai jos.
                </p>

                        {/* Action buttons with modern design */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <Link
                        to="/cars"
                                className="px-8 py-4 bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                                <CarFront className="w-5 h-5" />
                        Vezi toate mașinile
                    </Link>

                    <button
                        onClick={() => navigate(-1)}
                                className="px-8 py-4 border-2 border-theme-500 text-theme-500 hover:bg-theme-500 hover:text-white font-semibold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        Înapoi
                    </button>

                    <Link
                        to="/contact"
                                className="px-8 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        Contactează-ne
                    </Link>
                </div>

                {/* Suggestions */}
                {cars && cars.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                    Poate te interesează
                                </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {cars.map((car) => (
                                        <motion.div
                                            key={car.id}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                <Link
                                    to={`/cars/${car.id}`}
                                                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:shadow-xl hover:border-theme-300 transition-all duration-300 bg-white/60 backdrop-blur-sm"
                                >
                                                <div className="relative">
                                    <img
                                        src={car.image_url || ''}
                                        alt={car.make + ' ' + car.model}
                                                        className="w-20 h-16 object-cover rounded-xl flex-shrink-0 shadow-sm"
                                    />
                                                </div>
                                    <div className="text-left sm:flex-1">
                                                    <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                                                        {car.make + ' ' + car.model}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-2">{car.year}</div>
                                                    <div className="text-sm text-theme-600 font-bold">
                                                        {car.price_per_day ? `${car.price_per_day} € / zi` : 'Contactează-ne'}
                                                    </div>
                                    </div>
                                </Link>
                                        </motion.div>
                            ))}
                        </div>
                    </div>
                )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
