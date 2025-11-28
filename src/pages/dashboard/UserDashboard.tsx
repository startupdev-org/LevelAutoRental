import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Clock,
  Check,
  Truck,
} from 'lucide-react';
import { UserDashboardSidebar } from '../../components/dashboard/sidebar/UserDashboardSidebar';
import { Header } from '../../components/layout/Header';

import { UserOrdersSection } from './user-dashboard/orders/UserOrdersSection';

import { CarsView } from './user-dashboard/cars/UserCarPage'
import { ProfileSettingsTab } from './user-dashboard/profile-settings/ProfileSettingsTab';
import { OverviewTab } from './user-dashboard/overview/UserOverview';
import UserCalendarPage from './user-dashboard/calendar/UserCalendarPage';

interface Booking {
  id: string;
  carName: string;
  carImage: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  pickupLocation: string;
}

export type TabType = 'overview' | 'bookings' | 'profile' | 'settings' | 'calendar' | 'cars';


export const UserDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    bookingUpdates: true,
    promotions: false,
    newsletter: true
  });


  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, setSearchParams]);

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // SECURITY: Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if we're sure there's no user and loading is complete
    if (!loading && !user) {
      // Small delay to ensure session restoration is complete
      const timeoutId = setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [user, navigate, loading]);

  return (
    <div className="min-h-screen bg-black/10 text-white">
      {/* Full Screen Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-fixed"
              style={{
                backgroundImage: "url('/LevelAutoRental/lvl_bg.png')"
              }}
            />
            <div className="absolute inset-0 bg-black/70"></div>

            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="relative w-16 h-16 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-600 border-r-red-600/50 rounded-full animate-spin"></div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.loading.text')}</h2>
              <p className="text-gray-300 text-sm">{t('dashboard.loading.preparing')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Content */}
      {!isLoading && (
        <section className="relative min-h-screen">
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/LevelAutoRental/lvl_bg.png')",
              backgroundAttachment: 'fixed',
              zIndex: 0
            }}
          />
          <div className="fixed inset-0 bg-black/80" style={{ zIndex: 1 }}></div>

          <div className="relative" style={{ zIndex: 1 }}>
            <Header forceRender={true} />
          </div>

          {/* Dashboard box */}
          <div className="relative container mx-auto px-4 max-w-7xl pt-12 pb-12" style={{ zIndex: 1 }}>


            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">

              {/* Sidebar */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 lg:flex lg:justify-end"
              >
                <UserDashboardSidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onLogout={handleLogout}
                />
              </motion.div>

              {/* Main Content */}
              <div className="lg:col-span-9">
                {activeTab === 'overview' && (
                  <OverviewTab
                    setActiveTab={setActiveTab}
                    t={t}
                  />
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <UserOrdersSection />
                  </div>
                )}

                {/* Profile & Settings Tab */}
                {(activeTab === 'profile' || activeTab === 'settings') && (
                  <ProfileSettingsTab
                    t={t}
                    activeTab={activeTab}
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    notificationSettings={notificationSettings}
                    handleNotificationToggle={handleNotificationToggle}
                  />
                )}

                {/* Cars Tab */}
                {activeTab === 'cars' && (
                  <div className="space-y-6">
                    <CarsView />
                  </div>
                )}

                {/* Calendar Tab */}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <UserCalendarPage />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div >
  );
};
