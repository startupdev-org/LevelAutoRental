import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
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

  // Force styling for different pages
  const isDifferentPage =
    (location.pathname === '/not-found') ||
    (location.pathname === '/auth/login') ||
    (location.pathname === '/auth/signup') ||
    (location.pathname === '/contact') ||
    (location.pathname === '/cars');

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
      const triggerHeight = location.pathname === '/help' ? 70 : 150;
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
    { name: t('header.contact'), href: '/' }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (href: string) => {
    const scrollWithOffset = (el: HTMLElement) => {
      // Dynamic offset based on screen size: 80px for both mobile and desktop now
      const yOffset = -80;
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
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/LevelAutoRental/logo.png"
              alt="Level Auto Rental Logo"
              className={`w-[180px] lg:w-[190px] h-auto transition-all duration-300 ${isScrolled || isDifferentPage ? '' : 'brightness-0 invert'
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
              onClick={() => navigate('/auth/login')}
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
                <span
                  className={`fi ${currentLanguage === 'en'
                    ? 'fi-gb'
                    : currentLanguage === 'ru'
                      ? 'fi-ru'
                      : 'fi-ro'
                    } w-6 h-4 rounded-sm`}
                ></span>

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
                    {LANGUAGES.map(({ code, iconClass }) => (
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
                        <span>{t(`languages.${code}`)}</span>
                      </button>
                    ))}

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Mobile Language Selector */}
            <div className="relative language-dropdown-container">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className={`p-3 rounded-lg transition-all duration-200 ${isScrolled || isDifferentPage
                  ? 'text-gray-700 hover:text-theme-500 hover:bg-gray-100'
                  : 'text-white hover:text-theme-300 hover:bg-white/20'
                  }`}
              >
                <Globe className="w-5 h-5" />
              </button>

              {/* Mobile Language Dropdown */}
              <AnimatePresence>
                {showLanguageDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]"
                  >
                    {LANGUAGES.map(({ code, iconClass }) => (
                      <button
                        key={code}
                        onClick={() => {
                          i18n.changeLanguage(code);
                          setCurrentLanguage(code);
                          setShowLanguageDropdown(false);
                          localStorage.setItem("selectedLanguage", code);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-theme-50 hover:text-theme-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <span className={iconClass}></span>
                        <span>{t(`languages.${code}`)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-3 rounded-lg transition-all duration-200 ${isScrolled || isDifferentPage
                ? 'text-gray-700 hover:text-theme-500 hover:bg-gray-100'
                : 'text-white hover:text-theme-300 hover:bg-white/20'
                }`}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Mobile Menu Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <img
                        src="/LevelAutoRental/logo.png"
                        alt="Level Auto Rental Logo"
                        className="w-40 h-auto"
                      />
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Mobile Menu Content */}
                  <div className="flex-1 overflow-y-auto">
                    <nav className="p-6 space-y-2">
                      {navigation.map((item, index) => (
                        <motion.button
                          key={item.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleNavigate(item.href);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive(item.href)
                              ? 'bg-theme-50 text-theme-600 border-l-4 border-theme-500'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-theme-600'
                            }`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {item.name}
                        </motion.button>
                      ))}
                    </nav>

                    {/* Mobile Menu Footer */}
                    <div className="p-6 border-t border-gray-200 space-y-4">
                      <Button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/auth/login');
                        }}
                        className="w-full bg-theme-500 hover:bg-theme-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {t('header.auth')}
                      </Button>

                      {/* Mobile Language Selector */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {t('header.language')}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {LANGUAGES.map(({ code, iconClass }) => (
                            <button
                              key={code}
                              onClick={() => {
                                i18n.changeLanguage(code);
                                setCurrentLanguage(code);
                                localStorage.setItem("selectedLanguage", code);
                                setIsMenuOpen(false);
                              }}
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${currentLanguage === code
                                ? 'border-theme-500 bg-theme-50 text-theme-600'
                                : 'border-gray-200 text-gray-600 hover:border-theme-300 hover:bg-gray-50'
                                }`}
                            >
                              <span className={`${iconClass} w-6 h-4 mb-1`}></span>
                              <span className="text-xs font-medium">{t(`languages.${code}`)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
};




