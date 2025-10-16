import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { LANGUAGES } from "../../constants";
import { useTranslation } from 'react-i18next';

export const Header: React.FC = () => {

  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();


  // page where the sidebar will always be on scroll
  const shouldHeaderBeActive = () => {
    if (location.pathname === '/booking') {
      console.log('The header should be scrolled')
      return true;
    }
    return false;
  }


  const isDifferentPage = (location.pathname === '/not-found') || (location.pathname === '/login' || '/sign-up');
  // Force dark styling on 404 page


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(shouldHeaderBeActive);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Auto-close language dropdown after 3 seconds
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (showLanguageDropdown) {
      timeoutId = setTimeout(() => {
        setShowLanguageDropdown(false);
      }, 3000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showLanguageDropdown]);

  // Add scroll listener for navbar background
  React.useEffect(() => {
    const handleScroll = () => {

      const scrollPosition = window.scrollY;
      // Lower trigger height for help page to activate header styling earlier
      const triggerHeight = location.pathname === '/help' ? 70 : 600;
      setIsScrolled(scrollPosition > triggerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close language dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-dropdown-container')) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const navigation = [
    { name: t('header.home'), href: '/' },
    { name: t('header.cars'), href: '/cars' },
    { name: t('header.about'), href: '/about' },
    { name: t('header.howToRent'), href: '/how-to-rent' },
    { name: t('header.contact'), href: '/contact' }
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${isScrolled || isDifferentPage
        ? 'bg-white shadow-lg border-b border-gray-200'
        : 'bg-transparent shadow-none border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/LevelAutoRental/logo.png"
              alt="Level Auto Rental Logo"
              className={`w-[250px] h-auto transition-all duration-300 ${isScrolled || isDifferentPage ? '' : 'brightness-0 invert'
                }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-theme-50 hover:text-theme-500 ${isActive(item.href) ? 'text-theme-500 bg-theme-50' : isScrolled || isDifferentPage ? 'text-gray-700' : 'text-white'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">

            <Button
              className="px-6 py-2 bg-theme-500 hover:bg-theme-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => navigate('/login')}
            >
              {t('header.auth')}
            </Button>

            {/* Language Selector */}
            <div className="relative language-dropdown-container">
              <button
                onClick={() => {
                  setShowLanguageDropdown(!showLanguageDropdown)
                  // console.log('Current language after the variable: ', currentLanguage)
                  // console.log('Current language after the frameword: ', i18n.language)
                }}

                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 ${isScrolled || isDifferentPage ? 'text-gray-700 hover:text-theme-500' : 'text-white hover:bg-white/20'}`}
              >
                <span className={`fi ${currentLanguage === 'en' ? 'fi-gb' : currentLanguage === 'ru' ? 'fi-ru' : 'fi-ro'} text-base w-6 h-6 flex items-center justify-center overflow-hidden`}></span>
                <svg className={`w-4 h-4 transition-colors duration-300 ${isScrolled || isDifferentPage ? 'text-gray-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]"
                  >
                    {LANGUAGES.map(({ code, label, iconClass }) => (
                      <button
                        key={code}
                        onClick={() => {
                          i18n.changeLanguage(code); // switch language
                          setCurrentLanguage(code);  // update your local state
                          setShowLanguageDropdown(false); // close dropdown
                          localStorage.setItem("selectedLanguage", code); // persist selection
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-theme-50 hover:text-theme-500 transition-colors"
                      >
                        <span className={iconClass}></span>
                        <span>{label}</span>
                      </button>
                    ))}

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md transition-colors ${isScrolled || isDifferentPage ? 'text-gray-700 hover:text-theme-500 hover:bg-gray-100' : 'text-white hover:text-theme-300 hover:bg-white/20'}`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
                className={`block w-full text-left text-base font-medium transition-colors hover:text-theme-500 ${isActive(item.href) ? 'text-theme-500' : isScrolled || isDifferentPage ? 'text-gray-700' : 'text-white'}`}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {item.name}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="w-full">
              {t('header.auth')}
              {/* ff */}
            </Button>
          </div>
        </motion.div>

      </div>
    </header>
  );
};