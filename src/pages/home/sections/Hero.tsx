import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Search } from 'lucide-react';
import { BiSolidPhoneCall } from "react-icons/bi";
import React, { useState } from 'react';
import { BookingForm } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Hero: React.FC = () => {

  const { i18n, t } = useTranslation();

  const navigate = useNavigate();
  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    pickupLocation: '',
    returnLocation: '',
    pickupDate: todayDate.toISOString().split('T')[0],
    returnDate: tomorrowDate.toISOString().split('T')[0],
    category: ''
  });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showPickupCalendar, setShowPickupCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowLocationDropdown(false);
    setShowPickupCalendar(false);
    setShowReturnCalendar(false);
  };

  // Handle opening a specific dropdown and closing others
  const openDropdown = (dropdownType: 'location' | 'pickup' | 'return') => {
    // If clicking on the same dropdown that's already open, close it
    if ((dropdownType === 'location' && showLocationDropdown) ||
        (dropdownType === 'pickup' && showPickupCalendar) ||
        (dropdownType === 'return' && showReturnCalendar)) {
      closeAllDropdowns();
      return;
    }
    
    // Close all dropdowns first, then open the selected one
    closeAllDropdowns();
    switch (dropdownType) {
      case 'location':
        setShowLocationDropdown(true);
        break;
      case 'pickup':
        setShowPickupCalendar(true);
        break;
      case 'return':
        setShowReturnCalendar(true);
        break;
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside the entire search bar container
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    // Only add listener if any dropdown is open
    if (showLocationDropdown || showPickupCalendar || showReturnCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, showPickupCalendar, showReturnCalendar]);

  const handleInputChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log('Search cars:', bookingForm);
  };

  return (
    <section 
      className="relative h-[725px] bg-cover bg-no-repeat pt-36 font-sans bg-mobile-hero bg-hero-mobile md:bg-fixed md:bg-hero-desktop md:bg-hero-desktop"
      style={{
        backgroundImage: window.innerWidth < 768 
          ? "url('/LevelAutoRental/backgrounds/bg10-mobile.jpeg')" 
          : undefined,
        backgroundPosition: window.innerWidth < 768 
          ? 'center center' 
          : undefined
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible relative z-10">
        <div className="flex items-center justify-center h-full lg:pt-24">
          {/* Centered Text Content */}
          <div className="text-center space-y-10 max-w-4xl">
            <div className="space-y-8">
              <div className="space-y-6 ">
                <p className="text-lg md:text-xl text-theme-500 font-semibold drop-shadow-md uppercase tracking-wide">

                </p>
                <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                  Level Auto Rental
                </h1>

                <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                  {t('hero.label')}
                  <span className="text-theme-500 font-medium block"> {t('hero.smallLabel')}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="relative">
                  {/* Live Circle Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-red-400"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <motion.button 
                    className="relative px-8 py-4 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open('tel:+37362000112', '_self')}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {BiSolidPhoneCall({ className: "w-6 h-6" })}
                    </motion.div>
                    {t('hero.start')}
                  </motion.button>
                </div>
                <button
                  className="px-10 py-4 border-2 border-white hover:border-theme-500 text-white hover:text-theme-500 font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 bg-white/10 backdrop-blur-sm"
                  onClick={() => navigate('/cars')}
                >
                  {t('hero.seeCars')}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="py-[0px] top-[140px] lg:top-[305px] -mt-10 md:-mt-28 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dropdown-container">
            {/* Mobile Layout - Stack vertically */}
            <div className="flex flex-col md:hidden space-y-4 p-4">
              {/* Location */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  {t("hero.location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div
                    className="pl-10 pr-8 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors border border-gray-200 rounded-xl"
                    onClick={() => openDropdown('location')}
                  >
                    {bookingForm.pickupLocation || t("hero.searchLocation")}
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau Airport');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau Airport
                          </div>
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau');
                              closeAllDropdowns();
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

              {/* Date Row - Side by side on mobile */}
              <div className="grid grid-cols-2 gap-3">
                {/* Pickup Date */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                    {t("hero.pickUpDate")}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div
                      className="pl-10 pr-8 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors border border-gray-200 rounded-xl"
                      onClick={() => openDropdown('pickup')}
                    >
                      {formatDate(bookingForm.pickupDate) || t("hero.selectPickUpDate")}
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[280px]"
                          onClick={(e) => e.stopPropagation()}
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
                                className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                  } ${day && isSameDay(new Date(day), new Date(bookingForm.pickupDate))
                                    ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                    : ''
                                  }`}
                                onClick={() => {
                                  if (day) {
                                    handleInputChange('pickupDate', day);
                                    closeAllDropdowns();
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

                {/* Return Date */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                    {t("hero.returnDate")}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div
                      className="pl-10 pr-8 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors border border-gray-200 rounded-xl"
                      onClick={() => openDropdown('return')}
                    >
                      {formatDate(bookingForm.returnDate) || t("hero.selectReturnDate")}
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                          className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 w-[280px]"
                          onClick={(e) => e.stopPropagation()}
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
                                className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                  } ${day && isSameDay(new Date(day), new Date(bookingForm.returnDate))
                                    ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                    : ''
                                  }`}
                                onClick={() => {
                                  if (day) {
                                    handleInputChange('returnDate', day);
                                    closeAllDropdowns();
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
              </div>

              {/* Search Button - Full width on mobile */}
              <div className="w-full">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-theme-500 hover:bg-theme-600 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 stroke-2" />
                  {t("hero.search")}
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Horizontal flex */}
            <div className="hidden md:flex">
              {/* Location */}
              <div className="flex-1 px-6 py-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  {t("hero.location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => openDropdown('location')}
                  >
                    {bookingForm.pickupLocation || t("hero.searchLocation")}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau Airport');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau Airport
                          </div>
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              handleInputChange('pickupLocation', 'Chisinau');
                              closeAllDropdowns();
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
                  {t("hero.pickUpDate")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => openDropdown('pickup')}
                  >
                    {formatDate(bookingForm.pickupDate) || t("hero.selectPickUpDate")}
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
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                        onClick={(e) => e.stopPropagation()}
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
                              className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                } ${day && isSameDay(new Date(day), new Date(bookingForm.pickupDate))
                                  ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                  : ''
                                }`}
                              onClick={() => {
                                if (day) {
                                  handleInputChange('pickupDate', day);
                                  closeAllDropdowns();
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
                  {t("hero.returnDate")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <div
                    className="pl-10 pr-8 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => openDropdown('return')}
                  >
                    {formatDate(bookingForm.returnDate) || t("hero.selectReturnDate")}
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
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                        onClick={(e) => e.stopPropagation()}
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
                              className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                } ${day && isSameDay(new Date(day), new Date(bookingForm.returnDate))
                                  ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                  : ''
                                }`}
                              onClick={() => {
                                if (day) {
                                  handleInputChange('returnDate', day);
                                  closeAllDropdowns();
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
                  className="w-full h-full bg-theme-500 hover:bg-theme-600 text-white py-3 px-6 rounded-2xl font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 stroke-2" />
                  {t("hero.search")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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