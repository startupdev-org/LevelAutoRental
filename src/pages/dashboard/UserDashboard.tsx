import React, { useState } from 'react';
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
import { UserOrdersSection } from './user/orders/UserOrdersSection';

import { CarsView } from './user/cars/UserCarPage'
import ProfileTab from './profile/UserProfile';

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
  const { user, signOut } = useAuth();
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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
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

  // Redirect to sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('dashboard.errors.accessDenied')}</h1>
          <p className="text-gray-400 mb-8">{t('dashboard.errors.pleaseSignIn')}</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition duration-300"
          >
            {t('dashboard.errors.signIn')}
          </button>
        </div>
      </div>
    );
  }

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

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-4xl font-bold text-white">{t('dashboard.overview.title')}</h2>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="text-red-600" size={24} />
                              <h3 className="font-semibold">{t('dashboard.overview.totalBookings')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{orders.length}</p>
                            <p className="text-gray-400 text-sm">{t('dashboard.overview.lifetimeBookings')}</p>
                          </div>

                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                              <DollarSign className="text-red-600" size={24} />
                              <h3 className="font-semibold">{t('dashboard.overview.totalSpent')}</h3>
                            </div>
                            {/* <p className="text-3xl font-bold text-red-600">€{orders.reduce((sum, b) => sum + b.totalPrice, 0)}</p> */}
                            <p className="text-gray-400 text-sm">{t('dashboard.overview.lifetimeSpending')}</p>
                          </div>

                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                              <Star className="text-red-600" size={24} />
                              <h3 className="font-semibold">{t('dashboard.overview.loyaltyPoints')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-red-600">150</p>
                            <p className="text-gray-400 text-sm">{t('dashboard.overview.availablePoints')}</p>
                          </div>
                        </div>

                        {/* Recent Bookings */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{t('dashboard.overview.recentBookings')}</h3>
                            <button
                              onClick={() => setActiveTab('bookings')}
                              className="text-red-600 hover:text-red-500 transition-colors duration-300"
                            >
                              {t('dashboard.overview.viewAll')}
                            </button>
                          </div>
                          <div className="space-y-4">
                            {orders.slice(0, 2).map((booking) => (
                              <div key={booking.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300">
                                <img src={booking.carId} alt={booking.carId} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="flex-1">
                                  {/* <h4 className="font-semibold text-white">{booking.carName}</h4> */}
                                  {/* <p className="text-gray-400 text-sm">{formatDate(booking.startDate)}</p> */}
                                </div>
                                <div className="text-right">
                                  {/* <div className="text-lg font-bold text-red-600">€{booking.totalPrice}</div> */}
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    {getStatusIcon(booking.status)}
                                    <span className="capitalize">{t(`dashboard.status.${booking.status}`)}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
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
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <h2 className="text-4xl font-bold text-white">{t('dashboard.settings.title')}</h2>

                        {/* Password Change */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                          <h3 className="text-xl font-bold mb-4">{t('dashboard.settings.changePassword')}</h3>
                          <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.settings.currentPassword')}</label>
                              <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300"
                                placeholder={t('dashboard.settings.enterCurrentPassword')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.settings.newPassword')}</label>
                              <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300"
                                placeholder={t('dashboard.settings.enterNewPassword')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.settings.confirmNewPassword')}</label>
                              <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300"
                                placeholder={t('dashboard.settings.confirmNewPasswordPlaceholder')}
                              />
                            </div>
                            <button
                              type="submit"
                              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all duration-300"
                            >
                              {t('dashboard.settings.updatePassword')}
                            </button>
                          </form>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                          <h3 className="text-xl font-bold mb-4">{t('dashboard.settings.notificationSettings')}</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div>
                                <p className="font-medium">{t('dashboard.settings.bookingUpdates')}</p>
                                <p className="text-gray-400 text-sm">{t('dashboard.settings.bookingUpdatesDesc')}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notificationSettings.bookingUpdates}
                                  onChange={() => handleNotificationToggle('bookingUpdates')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div>
                                <p className="font-medium">{t('dashboard.settings.promotions')}</p>
                                <p className="text-gray-400 text-sm">{t('dashboard.settings.promotionsDesc')}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notificationSettings.promotions}
                                  onChange={() => handleNotificationToggle('promotions')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div>
                                <p className="font-medium">{t('dashboard.settings.newsletter')}</p>
                                <p className="text-gray-400 text-sm">{t('dashboard.settings.newsletterDesc')}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notificationSettings.newsletter}
                                  onChange={() => handleNotificationToggle('newsletter')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
