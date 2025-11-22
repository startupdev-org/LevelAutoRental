import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Calendar,
  CreditCard,
  User,
  LogOut,
  FileText,
  Clock,
  MapPin,
  Mail,
  Phone,
  Home,
  Settings,
  DollarSign,
  Check,
  X,
  Edit3,
  Eye,
  Download,
  Star,
  Truck,
  Plus
} from 'lucide-react';
import { UserDashboardSidebar } from '../../components/dashboard/sidebar/UserDashboardSidebar';
import CalendarPage from './calendar/CalendarPage';

import { orders } from '../../data/index'
import { UserOrdersSection } from './user-dashboard/orders/UserOrdersSection';

import { CarsView } from './user-dashboard/cars/UserCarPage'
import ProfileTab from './profile/UserProfile';
import { SettingsTab } from './user-dashboard/settings/UserSettings';
import { OverviewTab } from './user-dashboard/overview/UserOverview';

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [editForm, setEditForm] = useState({
    firstName: user?.email?.split('@')[0] || '',
    lastName: '',
    phone: '',
    email: user?.email || ''
  });

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

  const handleSaveProfile = () => {
    setIsEditing(false);
  };


  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'active':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-3 h-3" />;
      case 'active':
        return <Truck className="w-3 h-3" />;
      case 'completed':
        return <Check className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <section className="relative py-12 pt-32 md:pt-40 overflow-hidden min-h-screen">
          <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: "url('/LevelAutoRental/lvl_bg.png')"
            }}
          />
          <div className="absolute inset-0 bg-black/80"></div>


          {/* Dashboard box */}
          <div className="relative z-10 container mx-auto px-4 max-w-7xl">


            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Sidebar */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-1"
              >
                <UserDashboardSidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onLogout={handleLogout}
                />
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg lg:col-span-3"
              >
                <div className="space-y-6">
                  <AnimatePresence>

                    {activeTab === 'overview' && (
                      <OverviewTab setActiveTab={setActiveTab} />
                    )}


                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                      <motion.div
                        key="bookings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <UserOrdersSection />
                      </motion.div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <ProfileTab
                          activeTab={activeTab}
                          t={t}
                        />
                      </motion.div>
                    )}

                    {/* Cars Tab */}
                    {activeTab === 'cars' && (
                      <motion.div
                        key="cars"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >

                        <CarsView />

                      </motion.div>
                    )}

                    {/* Calendar Tab */}
                    {activeTab === 'calendar' && (
                      <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-between items-center">
                          <h2 className="text-4xl font-bold text-white">Car Calendar</h2>
                        </div>

                        <CalendarPage viewMode='user' />
                      </motion.div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                      <SettingsTab
                        t={t}
                        passwordForm={passwordForm}
                        setPasswordForm={setPasswordForm}
                        notificationSettings={notificationSettings}
                        handleNotificationToggle={handleNotificationToggle}
                      />
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </section >
      )}
    </div >
  );
};
