import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Home, Calendar, Settings, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { TabType } from '../../../pages/dashboard/UserDashboard';

interface SidebarItem {
    id: TabType;
    label: string;
    icon: React.ElementType;
}

interface UserDashboardSidebarProps {
    activeTab: TabType;
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
    onLogout: () => void;
}

export const UserDashboardSidebar: React.FC<UserDashboardSidebarProps> = ({
    activeTab,
    setActiveTab,
    onLogout,
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const sidebarItems: SidebarItem[] = [
        { id: 'overview', label: t('dashboard.sidebar.overview'), icon: Home },
        { id: 'bookings', label: t('dashboard.sidebar.myBookings'), icon: Car },
        { id: 'cars', label: t('dashboard.sidebar.cars'), icon: Car },
        { id: 'calendar', label: t('dashboard.sidebar.calendar'), icon: Calendar },
        { id: 'profile', label: t('dashboard.sidebar.profile'), icon: User },
        { id: 'settings', label: t('dashboard.sidebar.settings'), icon: Settings },
    ];

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-1 xl:col-span-1.5"
        >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 w-full max-w-[300px] mx-auto">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                    <div className="w-14 h-14 bg-red-600/20 rounded-full flex items-center justify-center">
                        <User className="text-red-600" size={28} />
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-semibold text-white text-base truncate">
                            {user?.email?.split('@')[0] || 'User'}
                        </h3>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-3">
                    {sidebarItems.map((item) => (
                        <motion.button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left font-medium text-sm tracking-wide transition-all duration-300 ${activeTab === item.id
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </motion.button>
                    ))}

                    <div className="h-[1px] bg-white/10 my-3" />

                    {/* Logout Button */}
                    <motion.button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 font-medium"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut size={20} />
                        <span>{t('dashboard.sidebar.signOut')}</span>
                    </motion.button>
                </nav>
            </div>
        </motion.div>
    );
};
