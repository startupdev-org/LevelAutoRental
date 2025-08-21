import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Search } from 'lucide-react';
import React, { useState } from 'react';
import { BookingForm } from '../../../types';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const Hero: React.FC = () => {
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    pickupLocation: '',
    returnLocation: '',
    pickupDate: '2024-02-15',
    returnDate: '2024-02-16',
    category: ''
  });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showPickupCalendar, setShowPickupCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);

  const handleInputChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log('Search cars:', bookingForm);
  };

  return (
    <section className="relative h-[70vh] bg-gradient-to-t from-blue-50 via-gray-100 to-gray-100 pt-20 font-sans">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full pt-16">
          {/* Left Side - Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
          >
                        <motion.div variants={fadeInUp} className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  <span className="text-blue-600 font-extrabold">Level Up</span> 
                  <br />
                  <span className="text-gray-800">Your Journey</span>
                </h1>
                
                                  <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
                    Premium car rental service available 24/7 across Moldova. 
                    <span className="text-blue-600 font-medium"> Start your journey today.</span>
                  </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Get Started
                </button>
                <button className="px-8 py-4 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105">
                  Browse Cars
                </button>
              </div>
            </motion.div>

          </motion.div>

          {/* Right Side - Car Image */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex justify-center lg:justify-end overflow-visible"
          >
            <div className="relative overflow-visible">
              <img
                src="/level-herocar.png"
                alt="Sports Car"
                className="w-[1200px] lg:w-[1800px] select-none pointer-events-none drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)] lg:-mr-20"
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
        className="py-[0px] top-[230px] -mt-10 md:-mt-28 relative z-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm ">
            <div className="flex">
              {/* Location */}
              <div className="flex-1 px-6 py-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  LOCATION
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div 
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  >
                    {bookingForm.pickupLocation || "Search your location.."}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showLocationDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      >
                        <div className="py-1">
                          <div 
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau Airport');
                              setShowLocationDropdown(false);
                            }}
                          >
                            Chisinau Airport
                          </div>
                          <div 
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau');
                              setShowLocationDropdown(false);
                            }}
                          >
                            Chisinau
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Pickup Date */}
              <div className="flex-1 px-6 py-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  PICKUP DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div 
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => setShowPickupCalendar(!showPickupCalendar)}
                  >
                    {formatDate(bookingForm.pickupDate) || "Select pickup date"}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Pickup Calendar Dropdown */}
                  <AnimatePresence>
                    {showPickupCalendar && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const newDate = new Date(bookingForm.pickupDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              handleInputChange('pickupDate', newDate.toISOString().split('T')[0]);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(bookingForm.pickupDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const newDate = new Date(bookingForm.pickupDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              handleInputChange('pickupDate', newDate.toISOString().split('T')[0]);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {generateCalendarDays(new Date(bookingForm.pickupDate)).map((day, index) => (
                            <div
                              key={index}
                              className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${
                                day ? 'text-gray-700' : 'text-gray-300'
                              } ${
                                day && isSameDay(new Date(day), new Date(bookingForm.pickupDate)) 
                                  ? 'bg-blue-500 text-white hover:bg-blue-600 font-medium' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (day) {
                                  handleInputChange('pickupDate', day);
                                  setShowPickupCalendar(false);
                                }
                              }}
                            >
                              {day ? new Date(day).getDate() : ''}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Return Date */}
              <div className="flex-1 px-6 py-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  RETURN DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div 
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => setShowReturnCalendar(!showReturnCalendar)}
                  >
                    {formatDate(bookingForm.returnDate) || "Select return date"}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Return Calendar Dropdown */}
                  <AnimatePresence>
                    {showReturnCalendar && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const newDate = new Date(bookingForm.returnDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              handleInputChange('returnDate', newDate.toISOString().split('T')[0]);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(bookingForm.returnDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const newDate = new Date(bookingForm.returnDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              handleInputChange('returnDate', newDate.toISOString().split('T')[0]);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {generateCalendarDays(new Date(bookingForm.returnDate)).map((day, index) => (
                            <div
                              key={index}
                              className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${
                                day ? 'text-gray-700' : 'text-gray-300'
                              } ${
                                day && isSameDay(new Date(day), new Date(bookingForm.returnDate)) 
                                  ? 'bg-blue-500 text-white hover:bg-blue-600 font-medium' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (day) {
                                  handleInputChange('returnDate', day);
                                  setShowReturnCalendar(false);
                                }
                              }}
                            >
                              {day ? new Date(day).getDate() : ''}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Search Button */}
              <div className="flex-1 px-6 py-4 flex items-center">
                <Button
                  onClick={handleSearch}
                  className="w-full h-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-2xl font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 stroke-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );

  // Helper functions
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }

  function generateCalendarDays(date: Date): (string | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: (string | null)[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      if (currentDate.getMonth() === month) {
        days.push(currentDate.toISOString().split('T')[0]);
      } else {
        days.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
};