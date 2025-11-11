import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Home, Calendar, Settings } from 'lucide-react';
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
        { id: 'bookings', label: t('dashboard.sidebar.myBookings'), icon: Calendar },
        { id: 'profile', label: t('dashboard.sidebar.profile'), icon: User },
        { id: 'settings', label: t('dashboard.sidebar.settings'), icon: Settings },
    ];

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-1"
        >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                        <User className="text-red-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">
                            {user?.email?.split('@')[0] || 'User'}
                        </h3>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                        <motion.button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${activeTab === item.id
                                ? 'bg-red-600 text-white'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </motion.button>
                    ))}

                    <div className="h-[1px] bg-white/10 my-2" />

                    {/* Logout Button */}
                    <motion.button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut size={18} />
                        <span>{t('dashboard.sidebar.signOut')}</span>
                    </motion.button>
                </nav>
            </div>
        </motion.div>
    );
};
