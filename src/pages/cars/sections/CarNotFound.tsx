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
            // console.log('fetched cars are: ', fetchedCars)
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
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                {/* Icon */}
                <div className="mx-auto w-24 h-24 rounded-full bg-red-600/10 flex items-center justify-center mb-6">
                    <CarFront className="w-10 h-10 text-red-600" />
                </div>

                {/* Heading */}
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                    Mașina nu a fost găsită
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-8 text-lg">
                    Ne pare rău — nu am găsit o mașină cu acel ID. Poți reveni la lista de mașini sau încerca una din sugestiile de mai jos.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <Link
                        to="/cars"
                        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
                    >
                        Vezi toate mașinile
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:shadow-sm transition"
                    >
                        Înapoi
                    </button>
                    <Link
                        to="/contact"
                        className="px-6 py-3 text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition"
                    >
                        Contactează-ne
                    </Link>
                </div>

                {/* Suggestions */}
                {cars && cars.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm text-gray-500 mb-4 font-medium">Poate te interesează</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {cars.map((car) => (
                                <Link
                                    key={car.id}
                                    to={`/cars/${car.id}`}
                                    className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 rounded-xl border hover:shadow-lg transition bg-white"
                                >
                                    <img
                                        src={car.image_url || ''}
                                        alt={car.make + ' ' + car.model}
                                        className="w-24 h-16 object-cover rounded-md flex-shrink-0"
                                    />
                                    <div className="text-left sm:flex-1">
                                        <div className="text-sm font-semibold text-gray-800 truncate">{car.make + ' ' + car.model}</div>
                                        <div className="text-xs text-gray-500">{car.year}</div>
                                        <div className="text-sm text-red-600 font-semibold mt-1">{car.price_per_day ? `${car.price_per_day} € / zi` : 'Contact'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
