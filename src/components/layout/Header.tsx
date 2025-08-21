import { motion, AnimatePresence } from 'framer-motion';
import { Car, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

// Declare global function for Google Translate
declare global {
  interface Window {
    changeLanguage: (lang: string) => void;
  }
}

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const location = useLocation();
  const navigate = useNavigate();

  // Detect current language from localStorage
  React.useEffect(() => {
    const detectCurrentLanguage = () => {
      const storedLang = localStorage.getItem('selectedLanguage');
      if (storedLang && ['en', 'ru', 'ro'].includes(storedLang)) {
        setCurrentLanguage(storedLang);
      } else {
        // Set English as default if no language is stored
        setCurrentLanguage('en');
        localStorage.setItem('selectedLanguage', 'en');
      }
    };

    detectCurrentLanguage();
  }, []);

  // Simple language change function
  const translatePage = (language: string) => {
    // Close dropdown immediately
    setShowLanguageDropdown(false);
    
    // Update local state immediately
    setCurrentLanguage(language);
    
    // Use the global changeLanguage function
    if (window.changeLanguage) {
      window.changeLanguage(language);
    }
  };

  // Add scroll listener for navbar background
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100); // Change background after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Fleet', href: '/cars' },
    { name: 'How it works', href: '/about' },
    { name: 'Why choose us', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (href: string) => {
    const scrollWithOffset = (el: HTMLElement) => {
      const yOffset = -80; // adjust to your header height
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    if (href.startsWith('/')) {
      navigate(href);
      return;
    }

    const el = document.getElementById(href);
    if (el) {
      scrollWithOffset(el);
    } else {
      navigate('/');
      setTimeout(() => {
        const el2 = document.getElementById(href);
        if (el2) scrollWithOffset(el2);
      }, 0);
    }
  };


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-transparent shadow-none border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.img 
              src="/logo.png" 
              alt="Level Auto Rental Logo" 
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="w-[250px] h-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-blue-50 hover:text-blue-600 ${isActive(item.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Become a renter
            </button>
            
            <Button 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Login
            </Button>
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <span className={`fi ${currentLanguage === 'en' ? 'fi-gb' : currentLanguage === 'ru' ? 'fi-ru' : 'fi-ro'} text-base w-6 h-6 flex items-center justify-center overflow-hidden`}></span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Language Dropdown */}
              <AnimatePresence>
                {showLanguageDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]"
                  >
                    <div className="py-1">
                      <button 
                        className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors"
                        onClick={() => translatePage('en')}
                      >
                        <span className="fi fi-gb text-base w-6 h-6 flex items-center justify-center overflow-hidden"></span>
                        <span>English</span>
                      </button>
                      <button 
                        className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors"
                        onClick={() => translatePage('ru')}
                      >
                        <span className="fi fi-ru text-base w-6 h-6 flex items-center justify-center overflow-hidden"></span>
                        <span>Русский</span>
                      </button>
                      <button 
                        className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors"
                        onClick={() => translatePage('ro')}
                      >
                        <span className="fi fi-ro text-base w-6 h-6 flex items-center justify-center overflow-hidden"></span>
                        <span>Română</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setIsMenuOpen(false);
                  handleNavigate(item.href);
                }}
                className={`block w-full text-left text-base font-medium transition-colors hover:text-blue-600 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-700'}`}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {item.name}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="w-full">
              Login
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};