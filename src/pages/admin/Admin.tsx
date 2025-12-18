import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    CalendarDays,
    Users as UsersIcon,
    Settings as SettingsIcon,
    LogOut,
    Home,
    X,
    RefreshCw,
    FileText,
} from 'lucide-react';
import { LiaCarSideSolid } from 'react-icons/lia';
import Settings from '../dashboard/settings/AdminSettings';
import { Car as CarType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { fetchCars } from '../../lib/cars';
import { fetchImagesByCarName } from '../../lib/db/cars/cars';
import { NotificationToaster } from '../../components/ui/NotificationToaster';

import { DashboardView } from './components/AdminDashboardView';
import { OrdersView, OrderDetailsView, CalendarView, UsersView, CarsView, RequestsView, RequestDetailsViewWrapper } from './components/views';
import { fetchBorrowRequestsForDisplay } from '../../lib/db/requests/requests';

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const section = searchParams.get('section') || 'dashboard';
    const orderId = searchParams.get('orderId');
    const carId = searchParams.get('carId');

    // URL sanitization - prevent infinite loops from malformed URLs
    useEffect(() => {
        const currentUrl = window.location.href;
        const searchString = window.location.search;

        // Check for malformed URLs that GitHub Pages creates
        const hasMalformedParams = (
            searchString.includes('~and~') ||
            searchString.includes('~') ||
            searchString.includes('&/') ||
            searchString.includes('/&') ||
            (searchString.match(/&/g) || []).length > 10
        );

        // If URL is malformed, redirect to clean admin URL
        if (hasMalformedParams) {
            navigate('/admin', { replace: true });
            return;
        }
    }, []); // Only run once on mount
    const { signOut, user, loading, isAdmin, roleLoaded, userProfile } = useAuth();
    const { i18n, t } = useTranslation();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [totalRequests, setTotalRequests] = useState<number>(0);
    const [cars, setCars] = useState<CarType[]>([]);

    // Security check: If user is not admin, don't render anything
    // AdminProtectedRoute should handle showing 404, but this is a safety net
    if (!loading && roleLoaded && user && !isAdmin) {
        return null; // Don't render admin content, AdminProtectedRoute will show 404
    }

    // Fetch cars at top level
    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();

                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );

                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            }
        };
        loadCars();
    }, []);

    // Close language dropdown when clicking outside
    useEffect(() => {
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

    // Fetch total requests count (only PENDING status)
    useEffect(() => {
        if (cars.length === 0) return;
        const loadRequestsCount = async () => {
            try {
                const response = await fetchBorrowRequestsForDisplay(1, 1000); // Get all requests for counting
                // Only count requests with PENDING status
                const pendingRequests = response.data.filter(request => request.status === 'PENDING');
                setTotalRequests(pendingRequests.length);
            } catch (error) {
                console.error('Failed to load requests count:', error);
            }
        };
        loadRequestsCount();
        // Refresh count periodically or when section changes
        const interval = setInterval(loadRequestsCount, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [refreshKey, cars]);

    // Force Romanian language for admin panel
    useEffect(() => {
        if (i18n.language !== 'ro') {
            i18n.changeLanguage('ro');
            localStorage.setItem('selectedLanguage', 'ro');
            setCurrentLanguage('ro');
        }
    }, [i18n]);

    const menuItems = [
        { id: 'dashboard', label: t('admin.menu.dashboard'), icon: LayoutDashboard },
        { id: 'requests', label: t('admin.menu.requests'), icon: FileText },
        { id: 'cars', label: t('admin.menu.cars'), icon: LiaCarSideSolid },
        { id: 'calendar', label: t('admin.menu.calendar'), icon: CalendarDays },
        { id: 'orders', label: t('admin.menu.orders'), icon: ShoppingCart },
        { id: 'users', label: t('admin.menu.users'), icon: UsersIcon },
    ];

    const handleSectionChange = (sectionId: string) => {
        setSearchParams({ section: sectionId });
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleBackToSite = () => {
        navigate('/');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Force remount of view components by changing key
        setRefreshKey(prev => prev + 1);
        // Simulate refresh delay for visual feedback
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const getPageTitle = () => {
        if (orderId) return t('admin.orderDetails.title', { id: orderId });
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return t('admin.requestDetails.title');
        }
        if (carId && section === 'cars') {
            const car = cars.find(c => c.id.toString() === carId);
            return car ? ((car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || t('admin.cars.name')) : t('admin.carDetails.title');
        }
        const item = menuItems.find(m => m.id === section);
        return item?.label || t('admin.menu.dashboard');
    };

    const getPageDescription = () => {
        if (orderId) return t('admin.orderDetails.description');
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return t('admin.requestDetails.description');
        }
        if (carId && section === 'cars') {
            return t('admin.carDetails.description');
        }
        switch (section) {
            case 'dashboard':
                return t('admin.dashboard.title');
            case 'requests':
                return t('admin.requests.description');
            case 'orders':
                return t('admin.orders.description');
            case 'cars':
                return t('admin.cars.description');
            case 'calendar':
                return t('admin.calendar.description');
            case 'users':
                return t('admin.users.description');
            default:
                return '';
        }
    };

    const renderContent = () => {
        if (orderId) {
            return <OrderDetailsView orderId={orderId} />;
        }

        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return <RequestDetailsViewWrapper requestId={requestId} />;
        }

        switch (section) {
            case 'dashboard':
                return <DashboardView key={refreshKey} />;
            case 'requests':
                return <RequestsView key={refreshKey} />;
            case 'orders':
                return <OrdersView key={refreshKey} />;
            case 'cars':
                return <CarsView key={refreshKey} />;
            case 'calendar':
                return <CalendarView key={refreshKey} />;
            case 'users':
                return <UsersView key={refreshKey} />;
            default:
                return <DashboardView key={refreshKey} />;
        }
    };

    return (
        <>
            <NotificationToaster />
            <style>{`
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                *::-webkit-scrollbar {
                    display: none !important;
                }
                .mobile-nav-scroll::-webkit-scrollbar {
                    display: none !important;
                }
                .mobile-nav-scroll {
                    -webkit-overflow-scrolling: touch;
                }
                /* Fix Safari dropdown styling */
                select {
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                }
                select::-ms-expand {
                    display: none !important;
                }
                option {
                    background-color: #343434 !important;
                    color: #ffffff !important;
                }
            `}</style>

            <div className="relative min-h-screen">
                {/* Background Image - Lowest layer */}
                {/* Desktop version with background-attachment: fixed */}
                <div
                    className="hidden lg:block fixed inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/bg-hero.jpg')",
                        backgroundAttachment: 'fixed',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        zIndex: 0
                    }}
                ></div>
                {/* Mobile version with img element for better mobile support */}
                <div className="lg:hidden fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                    <img
                        src="/bg-hero.jpg"
                        alt="Background"
                        className="w-full h-full object-cover fixed inset-0"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0
                        }}
                    />
                </div>
                {/* Dark Overlay - Over the background but under all content */}
                <div className="fixed inset-0 bg-black/70" style={{ zIndex: 1 }}></div>

                <div className="relative flex flex-col lg:flex-row min-h-screen" style={{ zIndex: 10 }}>
                    {/* Sidebar */}
                    <div className="w-full lg:w-72 lg:sticky lg:top-0 lg:h-screen bg-white/10 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col shadow-lg">
                        {/* Logo Section */}
                        <div className="p-6 border-b border-white/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <img
                                        src="/logo-LVL-white.png"
                                        alt="LVL Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <h1 className="text-lg font-bold text-white">{t('admin.title')}</h1>
                                        <p className="text-xs text-gray-300">{t('admin.subtitle')}</p>
                                    </div>
                                    {/* Mobile Refresh and Settings */}
                                    <div className="lg:hidden flex items-center gap-2">
                                        {/* Mobile Refresh Button */}
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20 disabled:opacity-50"
                                            title={t('admin.common.refresh')}
                                        >
                                            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                        {/* Mobile Settings Button */}
                                        <button
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                            title={t('admin.common.settings')}
                                        >
                                            <SettingsIcon className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav
                            className="flex-1 p-4 space-y-2 pt-6 overflow-x-auto lg:overflow-y-auto lg:overflow-x-visible mobile-nav-scroll"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-2 pb-2 lg:pb-0">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = section === item.id;
                                    const showBadge = item.id === 'requests' && totalRequests > 0;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSectionChange(item.id)}
                                            className={`flex-shrink-0 lg:w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start space-y-1 lg:space-y-0 lg:space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${isActive
                                                ? 'bg-red-500/20 text-white border border-red-500/50'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                                }`}
                                        >
                                            <div className="relative">
                                                {Icon && React.createElement(Icon as any, { className: `h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-white'}` })}
                                                {showBadge && (
                                                    <span className={`lg:hidden absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${isActive
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-yellow-500 text-gray-900'
                                                        }`}>
                                                        {totalRequests > 99 ? '99+' : totalRequests}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs lg:text-sm flex items-center justify-between w-full">
                                                <span>{item.label}</span>
                                                {showBadge && (
                                                    <span className={`hidden lg:flex ml-auto min-w-[20px] h-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${isActive
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-yellow-500 text-gray-900'
                                                        }`}>
                                                        {totalRequests > 99 ? '99+' : totalRequests}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Bottom Section */}
                        <div className="mt-auto hidden lg:block flex-shrink-0">
                            <div className="px-4 pt-6 pb-4 border-t border-white/20 space-y-3">
                                {/* Current User */}
                                <div className="flex items-center space-x-3 px-1 pb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                        <span className="text-white font-semibold text-sm">
                                            {userProfile?.first_name?.[0]?.toUpperCase() ||
                                                userProfile?.last_name?.[0]?.toUpperCase() ||
                                                user?.email?.[0]?.toUpperCase() ||
                                                'U'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {userProfile?.first_name && userProfile?.last_name
                                                ? `${userProfile.first_name} ${userProfile.last_name}`
                                                : userProfile?.first_name ||
                                                userProfile?.last_name ||
                                                user?.email?.split('@')[0] ||
                                                'User'}
                                        </p>
                                        <p className="text-xs text-gray-300 truncate">
                                            {userProfile?.email || user?.email || 'No email'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(true)}
                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                                        aria-label={t('admin.common.settings')}
                                    >
                                        <SettingsIcon className="w-4 h-4 text-gray-300 hover:text-white" />
                                    </button>
                                </div>

                                {/* Back Button */}
                                <button
                                    onClick={handleBackToSite}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/10 border border-white/20 text-gray-200 text-sm font-medium rounded-lg hover:bg-white/20 hover:border-white/30 hover:text-white transition-all duration-200"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>{t('admin.common.backToSite')}</span>
                                </button>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 hover:border-red-500/60 hover:text-red-200 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{t('admin.common.signOut')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Header */}
                        <div className="relative px-4 lg:px-8 py-6 lg:py-8 border-b border-white/20 backdrop-blur-xl" style={{ zIndex: 1 }}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                        {getPageTitle()}
                                    </h1>
                                    <p className="text-gray-300 text-sm lg:text-base">
                                        {getPageDescription()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Refresh Button - Desktop Only */}
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20 disabled:opacity-50"
                                        title="Refresh data"
                                    >
                                        <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
                            <div key={section}>
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Settings Modal */}
            {isSettingsModalOpen && createPortal(
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setIsSettingsModalOpen(false)}
                    style={{ zIndex: 10000 }}
                    data-modal-settings
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{t('admin.common.settings')}</h2>
                            </div>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <Settings
                                onBackToSite={handleBackToSite}
                                onLogout={handleLogout}
                            />
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root') || document.body
            )}

        </>
    );
};

