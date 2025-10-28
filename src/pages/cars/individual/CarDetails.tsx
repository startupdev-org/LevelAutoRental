import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CarFront, Calendar, MapPin, Heart } from 'lucide-react';

// Dummy car data (you can import this from /data/cars if you already have it)
import { cars } from '../../../data/cars';

export const CarDetails: React.FC = () => {
    const { carId } = useParams();
    const navigate = useNavigate();
    const car = cars.find((c) => c.id.toString() === carId);

    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);
    const gallery = (car && (car.gallery ?? [car.image]).filter(Boolean)) || [];

    useEffect(() => {
        // reset selected image when car changes
        setSelectedImage(car?.image);
        // scroll to top on mount
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId]);

    if (!car) {
        return (
            <div className="min-h-screen flex items-center justify-center py-24">
                <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
                    <h2 className="text-2xl font-semibold mb-4">Mașina nu a fost găsită</h2>
                    <p className="text-gray-600 mb-6">Verifică lista de mașini sau revino mai târziu.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to="/cars" className="px-6 py-3 bg-red-500 text-white rounded-xl shadow hover:bg-red-600">
                            Vezi mașini
                        </Link>
                        <button onClick={() => navigate(-1)} className="px-6 py-3 border rounded-xl">
                            Înapoi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatPrice = (p?: number) => (p ? `${p} € / zi` : 'Contact');

    return (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Left: Gallery / Hero */}
                <div className="lg:w-7/12">
                    <div className="relative rounded-xl overflow-hidden shadow-xl bg-gray-900 mt-14">
                        {/* main image */}
                        <img
                            src={selectedImage ?? car.image}
                            alt={car.name}
                            className="w-full h-[420px] md:h-[520px] object-cover"
                        />

                        {/* badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
                                {car.brand ?? car.name.split(' ')[0]}
                            </span>
                            {car.isFeatured && (
                                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold shadow">
                                    Featured
                                </span>
                            )}
                        </div>

                        {/* quick stats */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3">
                            <div className="flex items-center gap-4 text-white">
                                <div className="flex items-center gap-2">
                                    <CarFront className="w-5 h-5" />
                                    <span className="text-sm">{car.model ?? car.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span className="text-sm">{car.year}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-sm">{car.location ?? 'Local'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right text-white">
                                    <div className="text-lg font-bold">{formatPrice(car.pricePerDay)}</div>
                                    <div className="text-xs text-gray-200">Include asigurare standard</div>
                                </div>
                                <button
                                    onClick={() => {/* favorite action */ }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                    aria-label="Favorite"
                                >
                                    <Heart className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {gallery.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-3">
                            {gallery.map((src, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(src)}
                                    className={`rounded-xl overflow-hidden border-2 ${selectedImage === src ? 'border-red-500' : 'border-transparent'} transition-all`}
                                >
                                    <img src={src} alt={`${car.name}-${i}`} className="w-full h-20 object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details & CTA */}
                <aside className="lg:w-5/12">
                    <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-24">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {car.name}
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Star className="w-4 h-4" />
                                        <span className="font-semibold">{car.rating ?? '—'}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">· {car.reviewsCount ?? 0} recenzii</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{formatPrice(car.pricePerDay)}</div>
                                <div className="text-xs text-gray-500">Preț estimativ / zi</div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">Transmisie</span>
                                <span>{car.transmission ?? '—'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">Fuel</span>
                                <span>{car.fuelType ?? '—'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">Kilometraj</span>
                                <span>{car.kilometers ? `${car.kilometers.toLocaleString()} km` : '—'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">Locație</span>
                                <span>{car.location ?? '—'}</span>
                            </div>
                        </div>

                        <p className="mt-6 text-gray-700 leading-relaxed">{car.description ?? car.features}</p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => navigate(`/booking/${car.id}`)}
                                className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg"
                            >
                                Rezervă acum
                            </button>
                            <Link to="/cars" className="px-4 py-3 border rounded-xl text-gray-700 hover:shadow-sm flex items-center gap-2">
                                ← Vezi toate
                            </Link>
                        </div>

                        {/* additional features */}
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Echipare</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                {(car.equipment ?? ['GPS', 'Bluetooth', 'A/C']).map((eq: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span>{eq}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Full width specs / gallery / reviews block */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl p-6 shadow">
                        <h3 className="text-xl font-semibold mb-4">Specificații</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                            <div>
                                <div className="text-xs text-gray-500">Putere</div>
                                <div className="font-medium">{car.power ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Accelerație</div>
                                <div className="font-medium">{car.acceleration ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Consum</div>
                                <div className="font-medium">{car.fuelConsumption ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">ASigurare</div>
                                <div className="font-medium">{car.insurance ?? 'Standard'}</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-2">Descriere</h4>
                            <p className="text-gray-700 leading-relaxed">{car.longDescription ?? car.description}</p>
                        </div>
                    </div>

                    <div className="mt-6 bg-white rounded-2xl p-6 shadow">
                        <h3 className="text-xl font-semibold mb-4">Galerie</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {gallery.map((src, i) => (
                                <img key={i} src={src} alt={`${car.name}-gallery-${i}`} className="w-full h-40 object-cover rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Reviews / Seller info */}
                    <div className="space-y-6 mt-6">
                        <div className="bg-white rounded-2xl p-6 shadow">
                            <h4 className="text-lg font-semibold mb-3">Vânzător / Flotă</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold">{(car.sellerName ?? 'L').charAt(0)}</div>
                                <div>
                                    <div className="font-medium">{car.sellerName ?? 'LevelAuto'}</div>
                                    <div className="text-sm text-gray-500">{car.sellerLocation ?? 'Chișinău'}</div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link to={`/seller/${car.sellerId ?? ''}`} className="text-red-600 hover:underline text-sm">Vezi profil</Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow">
                            <h4 className="text-lg font-semibold mb-3">Recenzii</h4>
                            <div className="text-sm text-gray-600">Nu există recenzii încă.</div>
                        </div>
                    </div>
                </div>


            </div>

            {/* sticky mobile CTA */}
            <div className="fixed right-4 bottom-6 lg:hidden">
                <button
                    onClick={() => navigate(`/booking/${car.id}`)}
                    className="px-6 py-3 bg-red-600 text-white rounded-full shadow-lg"
                >
                    Rezervă {car.pricePerDay ? `${car.pricePerDay} €` : ''}
                </button>
            </div>
        </div>
    );
};
