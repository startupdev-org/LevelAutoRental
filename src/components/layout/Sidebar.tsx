import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Home, Briefcase, FileText, Calendar as Cal, Users, Settings, LogOut } from 'lucide-react';
import { Avatar, IconButton } from '@mui/material';

type SidebarProps = {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
    const nav = [
        { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
        { key: 'cars', label: 'Cars', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'orders', label: 'Orders', icon: <FileText className="w-4 h-4" /> },
        { key: 'calendar', label: 'Calendar', icon: <Cal className="w-4 h-4" /> },
        { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 280 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 overflow-hidden cursor-pointer"
            onClick={() => collapsed && setCollapsed(false)} // open when clicking collapsed sidebar
        >
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-theme-500 to-theme-700 flex items-center justify-center text-white font-bold">
                        L
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="text-sm font-bold text-gray-900">LevelAuto</div>
                            <div className="text-xs text-gray-400">Admin</div>
                        </div>
                    )}
                </div>

                {/* Hamburger toggle visible only when sidebar is open */}
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                        aria-label="Collapse sidebar"
                    >
                        <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-auto px-2 py-4">
                <ul className="space-y-1">
                    {nav.map(n => (
                        <li key={n.key}>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 ${!collapsed ? 'text-gray-600' : 'justify-center'
                                    }`}
                            >
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                                    {n.icon}
                                </span>
                                {!collapsed && <span>{n.label}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
                <Avatar sx={{ width: 40, height: 40 }}>O</Avatar>
                {!collapsed && (
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">Olivia Rhye</div>
                        <div className="text-xs text-gray-500">olivia@levelauto.rent</div>
                    </div>
                )}
                <IconButton size="small" className="text-gray-500">
                    <LogOut className="w-4 h-4" />
                </IconButton>
            </div>
        </motion.aside>
    );
};
