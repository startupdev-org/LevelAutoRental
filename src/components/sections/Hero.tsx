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
    pickupDate: '',
    returnDate: '',
    category: ''
  });

  const handleInputChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log('Search cars:', bookingForm);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1920)'
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Hero Text */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Find Your Perfect
              <span className="text-blue-400 block">Rental Car</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              Discover amazing deals on premium vehicles. Easy booking, great prices, and exceptional service.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Pickup Location"
                    value={bookingForm.pickupLocation}
                    onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Return Location"
                    value={bookingForm.returnLocation}
                    onChange={(e) => handleInputChange('returnLocation', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    placeholder="Pickup Date"
                    value={bookingForm.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    placeholder="Return Date"
                    value={bookingForm.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <Button
                  onClick={handleSearch}
                  className="w-full h-full flex items-center justify-center space-x-2"
                  size="lg"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Cars</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};