import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, 
    Calendar, 
    ChevronRight,
    Car,
    Gauge,
    UserRound,
    Zap,
    Shield,
    Baby,
    Wifi,
    Wrench,
    Phone,
    Send,
    Heart,
    Clock
} from 'lucide-react';

import { cars } from '../../../data/cars';
import { CarNotFound } from './CarNotFound';

export const CarDetails: React.FC = () => {
    const { carId } = useParams();
    const navigate = useNavigate();
    const car = cars.find((c) => c.id.toString() === carId);

    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);
    const gallery = (car && (car.photoGallery ?? [car.image]).filter(Boolean)) || [];

    // Rental booking state
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pickupDate, setPickupDate] = useState(today.toISOString().split('T')[0]);
    const [returnDate, setReturnDate] = useState(tomorrow.toISOString().split('T')[0]);
    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);

    useEffect(() => {
        setSelectedImage(car?.image);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId]);

    if (!car) {
        return <CarNotFound />
    }

    const handleBooking = () => {
        navigate(`/booking/${car.id}`, {
            state: {
                pickupDate,
                returnDate
            }
        });
    };

    return (
        <div id='individual-car-page' className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
                {/* Main Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_460px] gap-12">
                    {/* LEFT: Car Details */}
                    <div className="lg:col-start-1">
                        {/* Car Title & Rating - Mobile */}
                        <div className="mb-8 lg:hidden">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{car.name}</h1>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-gray-400 fill-current" />
                                    <span className="font-semibold text-gray-900">{car.rating}</span>
                                </div>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">{car.reviews} recenzii</span>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="relative rounded-lg overflow-hidden bg-white shadow-sm mb-6 border border-gray-200">
                            <img
                                src={selectedImage ?? car.image}
                                alt={car.name}
                                className="w-full h-[450px] md:h-[600px] object-cover"
                            />
                            
                            {/* Availability Badge - Minimalist */}
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm border border-gray-200">
                                    Disponibil acum
                                </span>
                            </div>

                            {/* Navigation arrows */}
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={() => {
                                            const currentIndex = gallery.findIndex(img => img === selectedImage);
                                            const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
                                            setSelectedImage(gallery[prevIndex]);
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 shadow-md transition-all border border-gray-200"
                                    >
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex = gallery.findIndex(img => img === selectedImage);
                                            const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
                                            setSelectedImage(gallery[nextIndex]);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 shadow-md transition-all border border-gray-200"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                                {gallery.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(src)}
                                        className={`rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImage === src 
                                                ? 'border-theme-500 ring-2 ring-theme-100' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <img 
                                            src={src} 
                                            alt={`${car.name}-${i}`} 
                                            className="w-full h-20 object-cover" 
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Car Specifications */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Caracteristici vehicul</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Locuri</div>
                                    <div className="text-lg font-semibold text-gray-900">{car.seats}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transmisie</div>
                                    <div className="text-lg font-semibold text-gray-900">{car.transmission}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Combustibil</div>
                                    <div className="text-lg font-semibold text-gray-900 capitalize">{car.fuelType}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Caroserie</div>
                                    <div className="text-lg font-semibold text-gray-900">{car.body}</div>
                                </div>
                            </div>

                            {/* Additional Specs */}
                            {(car.power || car.acceleration || car.fuelConsumption) && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Specificații tehnice</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {car.power && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Putere</div>
                                                <div className="text-base font-medium text-gray-900">{car.power}</div>
                                            </div>
                                        )}
                                        {car.acceleration && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Accelerație</div>
                                                <div className="text-base font-medium text-gray-900">{car.acceleration}</div>
                                            </div>
                                        )}
                                        {car.fuelConsumption && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Consum</div>
                                                <div className="text-base font-medium text-gray-900">{car.fuelConsumption} L/100km</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features & Equipment */}
                        {car.features && car.features.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Echipament inclus</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {car.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-theme-500 flex-shrink-0"></div>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Despre acest vehicul</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {car.longDescription ?? car.description ?? 
                                    `Inchiriați ${car.name} ${car.year} pentru experiențe premium de conducere. Acest vehicul ${car.body.toLowerCase()} oferă confort și performanță superioară, perfect pentru călătorii de afaceri sau vacanțe. Vehiculul este bine întreținut și echipat cu toate dotările moderne pentru siguranță și confort.`
                                }
                            </p>
                        </div>

                        {/* Rental Options */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Opțiuni de închiriere</h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { icon: Car, title: 'Livrare', price: 'Negociabil' },
                                    { icon: Car, title: 'Returnare', price: 'Negociabil' },
                                    { icon: Gauge, title: 'Km nelimitat', price: '+50%', highlight: true },
                                    { icon: Zap, title: 'Fără limită', price: '+20%', highlight: true },
                                    { icon: UserRound, title: 'Șofer', price: '800 MDL' },
                                    { icon: Star, title: 'Priority', price: '1000 MDL' },
                                    { icon: Shield, title: 'Asigurare', price: '+20%', highlight: true },
                                    { icon: Baby, title: 'Scaun copii', price: '100 MDL' },
                                    { icon: Wifi, title: 'Internet', price: '100 MDL' },
                                    { icon: Wrench, title: 'Asistență', price: '500 MDL' }
                                ].map((option, i) => {
                                    const Icon = option.icon;
                                    return (
                                        <div key={i} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all hover:shadow-sm text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mb-3">
                                                <Icon className="w-6 h-6 text-gray-700" />
                                            </div>
                                            <h3 className="font-medium text-gray-900 text-xs mb-2">{option.title}</h3>
                                            <div className={`text-sm font-bold ${option.highlight ? 'text-theme-500' : 'text-gray-700'}`}>
                                                {option.price}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Contract & Requirements */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Contract</h2>
                            <p className="text-gray-600 leading-relaxed text-sm mb-8">
                                Compania noastră oferă servicii de închiriere auto pe teritoriul Republicii Moldova, respectând cu strictețe legislația în vigoare. 
                                Interacțiunea cu clienții se bazează pe Contractul de închiriere, care garantează protecția juridică a intereselor acestora.
                            </p>

                            <h2 className="text-xl font-bold text-gray-900 mb-4">Condiții și cerințe</h2>
                            <p className="text-gray-600 mb-6 text-sm">
                                Pentru a închiria o mașină, trebuie îndeplinite următoarele cerințe și acceptate următoarele condiții:
                            </p>

                            <div className="space-y-6">
                                <div className="border-l border-gray-300 pl-4 py-2">
                                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Cerințe pentru șofer</h3>
                                    <ul className="space-y-2.5 text-sm text-gray-600">
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Vârsta minimă:</strong> 21 ani</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Permis de conducere:</strong> Categoria B, valabil</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Experiență:</strong> Minimum 3 ani de conducere</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Documente:</strong> Buletin de identitate</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="border-l border-gray-300 pl-4 py-2">
                                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Plată și depozit</h3>
                                    <ul className="space-y-2.5 text-sm text-gray-600">
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Plată integrală:</strong> 100% din taxa de închiriere înainte de preluare</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Depozit:</strong> Conform valorii stabilite în Contract. Returnat după 10 zile de la predare, în absența încălcărilor</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Metode de plată:</strong> Numerar, transfer bancar sau card</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="border-l border-gray-300 pl-4 py-2">
                                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Responsabilități și limitări</h3>
                                    <ul className="space-y-2.5 text-sm text-gray-600">
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Amende:</strong> Toate amenzile primite în timpul utilizării revin în responsabilitatea șoferului</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">CASCO:</strong> În lipsa poliței CASCO, responsabilitatea pentru accidente revine șoferului</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Kilometraj:</strong> Limită zilnică de 200 km. Depășirea se achită separat (sau activați opțiunea "Kilometraj nelimitat")</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="border-l border-gray-300 pl-4 py-2">
                                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Servicii suplimentare</h3>
                                    <ul className="space-y-2.5 text-sm text-gray-600">
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Returnare anticipată:</strong> Clientul are dreptul la recalcularea costului în caz de returnare anticipată</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Prelungire contract:</strong> Posibilă în format la distanță, dar nu este garantată</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Al doilea șofer:</strong> Înainte de semnarea contractului: 0 lei. După semnarea contractului: 500 lei</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                            <span><strong className="text-gray-900">Livrare/Returnare:</strong> Disponibilă la adresă convenabilă. Costul se confirmă la telefon <a href="tel:+37362000112" className="text-theme-500 hover:underline">+373 62 000-112</a></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Booking Widget */}
                    <aside className="lg:col-start-2">
                        <div
                            className="sticky"
                            style={{ top: 'calc(6rem + env(safe-area-inset-top))' }}
                        >
                            {/* Booking Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                {/* Price Display */}
                                <div className="mb-4">
                                    <div className="text-4xl font-bold text-gray-900 mb-2">2 300 MDL <span className="text-lg font-normal text-gray-600">pe zi</span></div>
                                    <div className="text-sm text-gray-500">116.06 EUR / 135.30 USD pe zi</div>
                                </div>

                                {/* Title */}
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                    Închiriere {car.name}, {car.year} an în Chișinău
                                </h2>

                                {/* Phone Button */}
                                <a
                                    href="tel:+37362000112"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>+373 (62) 000-112</span>
                                </a>

                                {/* Telegram Button */}
                                <a
                                    href="https://t.me/Level_Auto_Rental"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Scrie-ne pe Telegram</span>
                                </a>

                                {/* Help Text */}
                                <p className="text-center text-sm text-gray-500 mb-6">
                                    Ne puteți scrie sau apela, vă vom ajuta
                                </p>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {/* Pickup Date */}
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setShowPickupCalendar(!showPickupCalendar);
                                                setShowReturnCalendar(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-3 text-gray-500 hover:border-gray-400 transition-colors text-sm"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>Data primirii</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                                                >
                                                    <input
                                                        type="date"
                                                        value={pickupDate}
                                                        onChange={(e) => {
                                                            setPickupDate(e.target.value);
                                                            setShowPickupCalendar(false);
                                                        }}
                                                        min={today.toISOString().split('T')[0]}
                                                        className="w-full text-sm"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pickup Time */}
                                    <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-3 text-gray-500 hover:border-gray-400 transition-colors text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>__:__</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Return Date */}
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setShowReturnCalendar(!showReturnCalendar);
                                                setShowPickupCalendar(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-3 text-gray-500 hover:border-gray-400 transition-colors text-sm"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>Data returnării</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                                                >
                                                    <input
                                                        type="date"
                                                        value={returnDate}
                                                        onChange={(e) => {
                                                            setReturnDate(e.target.value);
                                                            setShowReturnCalendar(false);
                                                        }}
                                                        min={pickupDate}
                                                        className="w-full text-sm"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Return Time */}
                                    <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-3 text-gray-500 hover:border-gray-400 transition-colors text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>__:__</span>
                                    </button>
                                </div>

                                {/* Choose Dates Button + Heart */}
                                <div className="flex gap-3 mb-6">
                                    <button
                                        onClick={handleBooking}
                                        className="flex-1 bg-[#F4A6A6] hover:bg-[#F29999] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
                                    >
                                        Alegeți datele
                                    </button>
                                    <button className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                        <Heart className="w-6 h-6 text-gray-600" />
                                    </button>
                                </div>

                                {/* Pricing Tiers */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Costul închirierii</h3>
                                    
                                    <div className="space-y-3">
                                        {/* 1 day */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">De la 1 zi</span>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">2 300 MDL <span className="text-sm font-normal text-gray-600">pe zi</span></div>
                                            </div>
                                        </div>

                                        {/* 4 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 4 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-2%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">2 250 MDL <span className="text-sm font-normal text-gray-600">pe zi</span></div>
                                            </div>
                                        </div>

                                        {/* 8 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 8 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-4%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">2 200 MDL <span className="text-sm font-normal text-gray-600">pe zi</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Sticky Mobile Booking Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden z-50 p-4">
                    <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
                        <div>
                            <div className="text-xl font-bold text-gray-900">2 300 MDL</div>
                            <div className="text-xs text-gray-500">pe zi</div>
                        </div>
                        <button
                            onClick={handleBooking}
                            className="flex-1 bg-[#F4A6A6] hover:bg-[#F29999] text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors text-sm"
                        >
                            Alegeți datele
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
