import { motion } from 'framer-motion';
import { Calendar, MapPin, Search } from 'lucide-react';
import React, { useState } from 'react';
import { BookingForm } from '../../types';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const Hero: React.FC = () => {
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    pickupLocation: '',
    returnLocation: '',
    pickupDate: '2024-02-15',
    returnDate: '2024-02-16',
    category: ''
  });

  const handleInputChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log('Search cars:', bookingForm);
  };

  return (
    <section className="relative min-h-screen bg-gray-100 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
          {/* Left Side - Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
          >
            <motion.div variants={fadeInUp} className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                <span className="text-blue-600 relative inline-block">
                  Level up
                  <div className="absolute -bottom-1 left-0 w-full h-1 bg-blue-600 transform -skew-x-12"></div>
                </span>
                {' '}
                your auto renting experience. {' '}
              </h1>
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Get a car wherever and whenever you need it.
              </p>
            </motion.div>

          </motion.div>

          {/* Right Side - Car Image */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <img
                src="/maserati.png"
                alt="Sports Car"
                className="w-full max-w-xl md:max-w-2xl h-auto select-none pointer-events-none drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)] lg:-mr-10"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Bar Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="border-gray-200 py-12 -mt-10 md:-mt-28 relative z-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-3 tracking-wide">
                  LOCATION
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search your location.."
                    value={bookingForm.pickupLocation}
                    onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-3 tracking-wide">
                  PICKUP DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={bookingForm.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-3 tracking-wide">
                  RETURN DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={bookingForm.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium h-12"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};