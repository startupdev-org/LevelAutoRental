import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CarFront, Calendar, MapPin, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';

import { cars } from '../../../data/cars';
import { CarNotFound } from './CarNotFound';

export const CarDetails: React.FC = () => {
    const { carId } = useParams();
    const navigate = useNavigate();
    const car = cars.find((c) => c.id.toString() === carId);

    // heroImage: image shown in the main hero (changes when clicking thumbnails)
    const [heroImage, setHeroImage] = useState<string | undefined>(car?.image);
    // lightboxImage: image shown inside the lightbox / gallery viewer (separate)
    const [lightboxImage, setLightboxImage] = useState<string | undefined>(car?.image);
    const gallery = (car && (car.photoGallery ?? [car.image]).filter(Boolean)) || [];

    // Lightbox state & handlers for gallery images
    const [lightboxOpen, setLightboxOpen] = useState(false);
    // touch start X for swipe navigation on mobile lightbox
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const openLightbox = (src?: string) => {
        if (src) setLightboxImage(src);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = '';
    };

    // keyboard navigation for lightbox: Escape to close, ArrowLeft/ArrowRight to navigate
    const goToPrevImage = () => {
        if (!gallery.length) return;
        const idx = Math.max(0, gallery.findIndex((g) => g === lightboxImage));
        const prev = (idx - 1 + gallery.length) % gallery.length;
        setLightboxImage(gallery[prev]);
    };
    const goToNextImage = () => {
        if (!gallery.length) return;
        const idx = Math.max(0, gallery.findIndex((g) => g === lightboxImage));
        const next = (idx + 1) % gallery.length;
        setLightboxImage(gallery[next]);
    };

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') goToPrevImage();
            if (e.key === 'ArrowRight') goToNextImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen, lightboxImage, gallery]);

    useEffect(() => {
        // reset hero and lightbox images when car changes
        setHeroImage(car?.image);
        setLightboxImage(car?.image);
        // scroll to top on mount
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId]);

    if (!car) {
        return <CarNotFound />
    }

    const formatPrice = (p?: number) => (p ? `${p} € / zi` : 'Contact');

    return (
        <div id='individual-car-page' className="max-w-[1450px] mx-auto px-6 lg:px-12 py-12">
            {/* Use grid on large screens: left is a scrollable column, right is a fixed/sticky aside */}
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-10">
                {/* LEFT: scrollable column (contains gallery + specs + gallery + reviews) */}
                <div className="lg:col-start-1">
                    <div className="lg:pr-6 overflow-hidden">
                        {/* Gallery / Hero */}
                        <div className="relative rounded-xl overflow-hidden shadow-xl bg-gray-900 mt-20">
                            <img
                                src={heroImage ?? car.image}
                                alt={car.name}
                                // onClick={() => openLightbox(heroImage ?? car.image)}
                                className="w-full h-[240px] sm:h-[320px] md:h-[520px] lg:h-[600px] object-cover"
                                loading="eager"
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

                            {/* quick stats overlay:
                                - show compact view on mobile (name, year, price)
                                - show detailed view on md+ (original layout)
                            */}
                            {/* Compact mobile view: only name, year and price */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white md:hidden">
                                <div className="min-w-0">
                                    <div className="font-semibold truncate">{car.name}</div>
                                    <div className="text-[11px] text-gray-200">{car.year}</div>
                                </div>
                                <div className="ml-3 text-right">
                                    <div className="font-bold">{formatPrice(car.pricePerDay)}</div>
                                </div>
                            </div>

                            {/* Detailed view on md+ (keeps original info) */}
                            <div className="hidden md:flex absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-center gap-3 text-white font-bold">
                                    <div className="flex items-center gap-1">
                                        <CarFront className="w-4 h-4" />
                                        <span className="text-lg">{car.model ?? car.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-lg">{car.year}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-lg">{car.location ?? 'Local'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right text-white">
                                        <div className="text-lg font-bold">{formatPrice(car.pricePerDay)}</div>
                                        <div className="text-m text-gray-200">Include asigurare standard</div>
                                    </div>
                                    <button
                                        onClick={() => { /* favorite action */ }}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                        aria-label="Favorite"
                                    >
                                        <Heart className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails - set hero image (no lightbox, no thumbnail animation) */}
                        {gallery.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                                {gallery.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setHeroImage(src)} // thumbnails only change hero image
                                        className={`rounded-xl overflow-hidden border-2 ${heroImage === src ? 'border-red-500' : 'border-transparent'}`}
                                        aria-label={`Select ${car.name} thumbnail ${i + 1}`}
                                    >
                                        <img
                                            src={src}
                                            alt={`${car.name}-${i}`}
                                            className="w-full h-20 sm:h-24 md:h-28 object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Full width specs / gallery / reviews block (moved inside left scrollable column) */}
                        <div className="mt-10">
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
                                        <div className="text-xs text-gray-500">Asigurare</div>
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                                    {gallery.map((src, i) => (
                                        <button
                                            key={i}
                                            onClick={() => openLightbox(src)}
                                            className="overflow-hidden rounded-lg"
                                            aria-label={`Open gallery image ${i + 1}`}
                                        >
                                            <img
                                                src={src}
                                                alt={`${car.name}-gallery-${i}`}
                                                className="w-full h-36 sm:h-40 md:h-48 object-cover rounded-lg"
                                                loading="lazy"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* RIGHT: sticky details, seller, and reviews */}
                <aside className="lg:col-start-2 mt-24">
                    {/* increase space from top (header) and account for device safe-area */}
                    <div
                        className="sticky flex flex-col gap-10"
                        // larger top offset so the sticky block sits lower under the header
                        style={{ top: 'calc(7rem + env(safe-area-inset-top))' }}
                    >
                        {/* MAIN DETAILS + CTA */}
                        <div className="bg-white rounded-2xl shadow-xl p-10 scale-[1.05] mt-4 lg:mt-0">
                            <div className="flex flex-col gap-3">
                                {/* TITLE - first row (full width, truncates) */}
                                <h1
                                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight truncate"
                                    title={car.name}
                                >
                                    {car.name}
                                </h1>

                                {/* SECOND ROW: left = rating + reviews, right = price (aligned) */}
                                <div className="mt-0 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 min-w-0">
                                        <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
                                            <Star className="w-4 h-4" />
                                            <span className="font-semibold">{car.rating ?? '—'}</span>
                                        </div>
                                        <span className="truncate text-gray-500">· {car.reviews ?? 0} recenzii</span>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-red-600 font-extrabold text-lg sm:text-xl md:text-2xl">
                                            {formatPrice(car.pricePerDay)}
                                        </div>
                                        <div className="text-xs text-gray-500">Pret estimativ / zi</div>
                                    </div>
                                </div>
                            </div>

                            {/* SPECS */}
                            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">Transmisie</span>
                                    <span>{car.transmission ?? '—'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">Combustibil</span>
                                    <span>{car.fuelType ?? '—'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">Caroserie</span>
                                    <span>{car.body}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">Numarul de locuri</span>
                                    <span>{car.seats ?? '—'}</span>
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="mt-6 text-gray-700 leading-relaxed space-y-4">
                                {/* {car.description && (
                                    <p>{car.description}</p>
                                )} */}

                                {car.features && car.features.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">Caracteristici / Funcții:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {car.features.map((feature, i) => (
                                                <li key={i}>{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>


                            {/* CTA */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => navigate(`/booking/${car.id}`)}
                                    className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                                >
                                    Rezervă acum
                                </button>
                            </div>

                            {/* FEATURES */}
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

                        {/* REVIEWS */}
                        <div className="bg-white rounded-2xl p-6 scale-[1.06]">
                            <h4 className="text-xl font-semibold mb-3">Recenzii</h4>
                            <div className="text-sm text-gray-600">
                                Nu există recenzii încă.
                            </div>
                        </div>
                    </div>
                </aside>

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

            {/* Lightbox modal */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={closeLightbox}
                >
                    <div
                        className="relative flex items-center justify-center gap-3 sm:gap-6 md:gap-10 lg:max-w-[90%] sm:max-w-[30%] max-h-[96%] w-full"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
                        onTouchEnd={(e) => {
                            if (touchStartX == null) return setTouchStartX(null);
                            const endX = e.changedTouches[0]?.clientX ?? 0;
                            const diff = touchStartX - endX;
                            setTouchStartX(null);
                            if (Math.abs(diff) < 40) return;
                            if (diff > 0) goToNextImage();
                            else goToPrevImage();
                        }}
                    >
                        {/* Left Arrow */}
                        <button
                            onClick={goToPrevImage}
                            aria-label="Previous image"
                            className="flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition focus:outline-none"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>

                        {/* Image container */}
                        <div className="relative">
                            <motion.img
                                src={lightboxImage ?? car.image}
                                alt={car.name}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.18 }}
                                className="mx-auto max-w-full max-h-[45vh] sm:max-h-[50vh] md:max-h-[80vh] object-contain rounded-md shadow-lg"
                            />

                            {/* Close button at top-right of the image */}
                            <button
                                onClick={closeLightbox}
                                aria-label="Close image"
                                className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/80 p-1 sm:p-2 shadow-md hover:bg-white hover:dark:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" />
                            </button>

                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={goToNextImage}
                            aria-label="Next image"
                            className="flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition focus:outline-none"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            )}



        </div>
    );
};
