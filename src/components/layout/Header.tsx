import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, User, LogOut, Settings, LayoutDashboard, ChevronDown, FileText, Shield } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { LANGUAGES } from "../../constants";
import { useTranslation } from 'react-i18next';
import { hiddenPaths } from '../../data';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  forceRender?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ forceRender }) => {

  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, isAdmin } = useAuth();

  const shouldRenderHeader = forceRender || !hiddenPaths.some(path => location.pathname.startsWith(path));

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
    (location.pathname === '/auth/signup') ||
    (location.pathname === '/contact') ||
    (location.pathname === '/cars') ||
    (document.getElementById('car-not-found')) ||
    (document.getElementById('individual-car-page'));

  // Check if we're on auth pages for transparent header
  const isAuthPage = location.pathname === '/auth/login' || location.pathname === '/auth/signup';
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';
  
  // Pages with hero sections that need white text when header is transparent
  const pagesWithHeroSections = [
    '/',
    '/about',
    '/contact',
    '/how-to-rent',
    '/reviews',
    '/terms',
    '/calculator',
    '/not-found'
  ];
  
  const isNotFoundPage = !!document.getElementById('not-found-page');
  const hasHeroSection = pagesWithHeroSections.includes(location.pathname) || isNotFoundPage;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(shouldHeaderBeActive);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const userDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [userDropdownPosition, setUserDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  
  // Determine if header text should be white
  // White text when: on auth pages, or on pages with hero sections when not scrolled, or when forceRender is true
  // Note: hasHeroSection takes priority over isDifferentPage for text color
  const shouldShowWhiteText = isAuthPage || (hasHeroSection && !isScrolled) || (forceRender && !isScrolled && !isDifferentPage);

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
    // Initialize scroll state for pages that should always have active header
    if (shouldHeaderBeActive()) {
      setIsScrolled(true);
    }

    const handleScroll = () => {

      const scrollPosition = window.scrollY;
      // Lower trigger height for help page to activate header styling earlier
      const triggerHeight = location.pathname === '/help' ? 70 : 150;
      setIsScrolled(scrollPosition > triggerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Update user dropdown position when it opens
  useEffect(() => {
    if (showUserDropdown && forceRender && userDropdownButtonRef.current) {
      const rect = userDropdownButtonRef.current.getBoundingClientRect();
      setUserDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    } else {
      setUserDropdownPosition(null);
    }
  }, [showUserDropdown, forceRender]);

  // Close language dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-dropdown-container')) {
        setShowLanguageDropdown(false);
      }
      if (!target.closest('.user-dropdown-container') && !target.closest('.user-dropdown-portal')) {
        setShowUserDropdown(false);
      }
    };

    if (showLanguageDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown, showUserDropdown]);

  const handleLogout = (e?: React.MouseEvent) => {
    console.log('=== LOGOUT BUTTON CLICKED ===');
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Close dropdowns immediately
    setShowUserDropdown(false);
    setIsMenuOpen(false);
    
    // Clear storage immediately
    console.log('Clearing storage...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('Storage cleared');
    
    // Try to sign out, but don't wait for it - use timeout
    console.log('Calling signOut with timeout...');
    const signOutPromise = signOut();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('SignOut timeout - proceeding with logout anyway');
        resolve({ error: null });
      }, 1000); // 1 second timeout
    });
    
    Promise.race([signOutPromise, timeoutPromise])
      .then((result: any) => {
        console.log('SignOut completed or timed out:', result);
        if (result?.error) {
          console.error('Logout error:', result.error);
        } else {
          console.log('Logout successful (or timed out)');
        }
      })
      .catch((err) => {
        console.error('Logout promise rejected:', err);
      })
      .finally(() => {
        console.log('Reloading page...');
        // Force reload regardless of signOut result
        window.location.replace('/');
      });
  };

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

  if (!shouldRenderHeader) return null;

  return (
    <header
      className={`${forceRender ? 'relative' : 'fixed top-0 left-0 right-0'} ${forceRender ? 'z-[9999999]' : 'z-50'} transition-all duration-300 font-sans ${isAuthPage
        ? 'bg-transparent shadow-none border-transparent'
        : (hasHeroSection && !isScrolled) || (forceRender && !isScrolled && !isDifferentPage)
          ? 'bg-transparent shadow-none border-transparent' // Transparent on pages with hero sections when not scrolled
          : isScrolled || (isDifferentPage && !hasHeroSection)
            ? 'bg-white border-b border-gray-200' // White on scroll or different page (unless it has hero section)
            : 'bg-transparent shadow-none border-transparent' // Default transparent
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/LevelAutoRental/logo.png"
              alt="Level Auto Rental Logo"
              className={`w-[180px] lg:w-[190px] h-auto transition-all duration-300 ${shouldShowWhiteText ? 'brightness-0 invert' : ''
                }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-theme-50 hover:text-theme-500 ${isActive(item.href) ? 'text-theme-500 bg-theme-50' : shouldShowWhiteText ? 'text-white' : 'text-gray-700'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative user-dropdown-container">
                <button
                  ref={userDropdownButtonRef}
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                    shouldShowWhiteText
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                    shouldShowWhiteText
                      ? 'bg-white/20 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {(user.email?.split('@')[0] || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${shouldShowWhiteText ? 'text-white' : 'text-gray-700'}`}>
                      {user.email?.split('@')[0] || user.email}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''} ${
                      shouldShowWhiteText ? 'text-white' : 'text-gray-500'
                    }`} 
                  />
                </button>

                {/* User Dropdown Menu */}
                {forceRender ? (
                  showUserDropdown && userDropdownPosition ? createPortal(
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="user-dropdown-portal fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[99999999] min-w-[220px] overflow-hidden"
                        style={{
                          top: `${userDropdownPosition.top}px`,
                          right: `${userDropdownPosition.right}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                      <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.email?.split('@')[0] || user.email}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/dashboard?tab=overview');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>{t('header.dashboard')}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/dashboard?tab=bookings');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{t('dashboard.sidebar.myBookings')}</span>
                        </button>
                        
                        {!isAdmin && (
                          <button
                            onClick={() => {
                              navigate('/dashboard?tab=settings&subTab=settings');
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>{t('header.settings')}</span>
                          </button>
                        )}
                        
                        {isAdmin && (
                          <button
                            onClick={() => {
                              navigate('/admin');
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            <span>{t('header.admin')}</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={(e) => {
                            console.log('Desktop logout button clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogout(e);
                          }}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('header.signOut')}</span>
                        </button>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body
                  ) : null
                ) : (
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[220px] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user.email?.split('@')[0] || user.email}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate('/dashboard?tab=overview');
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>{t('header.dashboard')}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              navigate('/dashboard?tab=bookings');
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{t('dashboard.sidebar.myBookings')}</span>
                          </button>
                          
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                navigate('/dashboard?tab=settings&subTab=settings');
                                setShowUserDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              <span>{t('header.settings')}</span>
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setShowUserDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              <span>{t('header.admin')}</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-100 py-2">
                          <button
                            onClick={(e) => {
                              console.log('Desktop logout button clicked');
                              e.preventDefault();
                              e.stopPropagation();
                              handleLogout(e);
                            }}
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('header.signOut')}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ) : (
              <Button
                className="px-6 py-2 bg-theme-500 hover:bg-theme-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => navigate('/auth/login')}
              >
                {t('header.auth')}
              </Button>
            )}

            {/* Language Selector */}
            <div className="relative language-dropdown-container">
              <button
                onClick={() => {
                  setShowLanguageDropdown(!showLanguageDropdown)
                  // console.log('Current language after the variable: ', currentLanguage)
                  // console.log('Current language after the frameword: ', i18n.language)
                }}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 ${shouldShowWhiteText ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:text-theme-500'}`}
              >
                <span
                  className={`fi ${currentLanguage === 'en'
                    ? 'fi-gb'
                    : currentLanguage === 'ru'
                      ? 'fi-ru'
                      : 'fi-ro'
                    } w-6 h-4 rounded-sm`}
                ></span>

                <svg className={`w-4 h-4 transition-colors duration-300 ${shouldShowWhiteText ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg ${forceRender ? 'z-[99999999]' : 'z-50'} min-w-[160px]`}
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
                className={`p-3 rounded-lg transition-all duration-200 ${shouldShowWhiteText
                  ? 'text-white hover:text-theme-300 hover:bg-white/20'
                  : 'text-gray-700 hover:text-theme-500 hover:bg-gray-100'
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
                    className={`absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg ${forceRender ? 'z-[99999999]' : 'z-50'} min-w-[140px]`}
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
              className={`p-3 rounded-lg transition-all duration-200 ${shouldShowWhiteText
                ? 'text-white hover:text-theme-300 hover:bg-white/20'
                : 'text-gray-700 hover:text-theme-500 hover:bg-gray-100'
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
        {forceRender ? (
          isMenuOpen ? createPortal(
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 z-[99999998] lg:hidden"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {/* Mobile Menu Panel */}
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[99999999] lg:hidden"
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
                      {isAuthenticated && user ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-semibold text-white text-sm">
                              {(user.email?.split('@')[0] || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {user.email?.split('@')[0] || user.email}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/dashboard?tab=overview');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>{t('header.dashboard')}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/dashboard?tab=bookings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{t('dashboard.sidebar.myBookings')}</span>
                          </button>
                          
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/dashboard?tab=settings&subTab=settings');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              <span>{t('header.settings')}</span>
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/admin');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              <span>{t('header.admin')}</span>
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsMenuOpen(false);
                              handleLogout(e);
                            }}
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('header.signOut')}</span>
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/auth/login');
                          }}
                          className="w-full bg-theme-500 hover:bg-theme-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {t('header.auth')}
                        </Button>
                      )}

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
          </AnimatePresence>,
          document.body
          ) : null
        ) : (
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
                        {isAuthenticated && user ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-semibold text-white text-sm">
                                {(user.email?.split('@')[0] || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {user.email?.split('@')[0] || user.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/dashboard?tab=overview');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span>{t('header.dashboard')}</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/dashboard?tab=settings&subTab=profile');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <User className="w-4 h-4" />
                              <span>{t('header.profile')}</span>
                            </button>
                            
                            {!isAdmin && (
                              <button
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  navigate('/dashboard?tab=settings&subTab=settings');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                                <span>{t('header.settings')}</span>
                              </button>
                            )}
                            
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  navigate('/admin');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                <span>{t('header.admin')}</span>
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMenuOpen(false);
                                handleLogout(e);
                              }}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>{t('header.signOut')}</span>
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/auth/login');
                            }}
                            className="w-full bg-theme-500 hover:bg-theme-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            {t('header.auth')}
                          </Button>
                        )}

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
        )}

      </div>
    </header>
  );
};




