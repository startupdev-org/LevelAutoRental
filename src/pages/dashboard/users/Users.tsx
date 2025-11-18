import React, { useState, useMemo, useEffect } from "react";
import { User } from "../../../types";
import {
    ArrowLeft,
    ArrowRight,
    Mail,
    Car,
    User as UserIcon,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    Phone,
    DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { OrderDisplay } from "../../../lib/orders";
import { cars } from "../../../data/cars";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useTranslation } from "react-i18next";

export const UsersPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [userOrders, setUserOrders] = useState<OrderDisplay[]>([]);
    const pageSize = 10;

    // Load users from Profiles table and orders
    useEffect(() => {
        const loadUsersAndOrders = async () => {
            try {
                // Load orders for statistics
                const { fetchRentalsOnly } = await import('../../../lib/orders');
                const data = await fetchRentalsOnly(cars);
                const rentals = data.filter(order => order.type === 'rental');
                setUserOrders(rentals);

                // Fetch users from Profiles table
                const { data: profilesData, error: profilesError } = await supabase
                    .from('Profiles')
                    .select('id, first_name, last_name, email, phone_number, role, created_at, updated_at')
                    .order('created_at', { ascending: false });

                if (profilesError) {
                    console.error('Failed to load users from Profiles table:', profilesError);
                    // Fallback to extracting from orders if Profiles table fails
                const userMap = new Map<string, User>();
                rentals.forEach((order) => {
                    if (!order.customerName || !order.customerEmail) return;
                    const email = order.customerEmail.toLowerCase();
                    if (!userMap.has(email)) {
                        const nameParts = order.customerName.trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        userMap.set(email, {
                                id: email, // Use email as ID fallback
                            first_name: firstName,
                            last_name: lastName,
                            email: order.customerEmail,
                            phone_number: order.customerPhone || undefined,
                                role: 'User',
                        });
                    }
                });
                    setUsers(Array.from(userMap.values()));
                    return;
                }

                if (profilesData && profilesData.length > 0) {
                    // Map database data to User type
                    const usersList: User[] = profilesData.map((profile) => ({
                        id: profile.id,
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        email: profile.email || '',
                        phone_number: profile.phone_number || undefined,
                        role: profile.role || 'User',
                    }));
                    setUsers(usersList);
                } else {
                    // No users in Profiles table, fallback to empty array
                    setUsers([]);
                }
            } catch (error) {
                console.error('Failed to load users and orders:', error);
                // Fallback to empty array on error
                setUsers([]);
            }
        };
        loadUsersAndOrders();
    }, []);

    // Get user order count
    const getUserOrderCount = (userId: string | number): number => {
        const user = users.find(u => u.id === userId || u.id.toString() === userId.toString());
        if (!user) return 0;

        return userOrders.filter(order => {
            // Match by email (most reliable) or customer name
            return order.customerEmail?.toLowerCase() === user.email.toLowerCase() ||
                order.customerName?.toLowerCase() === `${user.first_name} ${user.last_name}`.toLowerCase();
        }).length;
    };

    // Get user total spent
    const getUserTotalSpent = (userId: string | number): number => {
        const user = users.find(u => u.id === userId || u.id.toString() === userId.toString());
        if (!user) return 0;

        return userOrders
            .filter(order => {
                // Match by email (most reliable) or customer name
                return order.customerEmail?.toLowerCase() === user.email.toLowerCase() ||
                    order.customerName?.toLowerCase() === `${user.first_name} ${user.last_name}`.toLowerCase();
            })
            .reduce((sum, order) => sum + (order.amount || 0), 0);
    };

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let filtered = users.filter(
            (u) => {
                const matchesSearch =
                    u.first_name.toLowerCase().includes(search.toLowerCase()) ||
                    u.last_name.toLowerCase().includes(search.toLowerCase()) ||
                    (u.phone_number && u.phone_number.toLowerCase().includes(search.toLowerCase())) ||
                    u.email.toLowerCase().includes(search.toLowerCase());
                return matchesSearch;
            }
        );

        if (sortBy) {
            filtered.sort((a, b) => {
                let aValue: string | number = '';
                let bValue: string | number = '';

                switch (sortBy) {
                    case 'name':
                        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
                        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
                        break;
                    case 'email':
                        aValue = a.email.toLowerCase();
                        bValue = b.email.toLowerCase();
                        break;
                    case 'role':
                        aValue = a.role.toLowerCase();
                        bValue = b.role.toLowerCase();
                        break;
                }

                if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [users, search, sortBy, sortOrder, userOrders]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleSort = (field: 'name' | 'email' | 'role') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Get user orders for selected user
    const selectedUserOrders = selectedUser
        ? userOrders.filter(order => {
            // Match by email (most reliable) or customer name
            return order.customerEmail?.toLowerCase() === selectedUser.email.toLowerCase() ||
                order.customerName?.toLowerCase() === `${selectedUser.first_name} ${selectedUser.last_name}`.toLowerCase();
        })
        : [];

    return (
        <div className="space-y-6">
            {/* Users Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={t('admin.users.search')}
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        {t('admin.users.user')}
                                        {sortBy === 'name' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('email')}
                                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        {t('admin.users.email')}
                                        {sortBy === 'email' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {t('admin.users.phone')}
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('role')}
                                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        {t('admin.users.role')}
                                        {sortBy === 'role' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {t('admin.users.rentals')}
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {t('admin.users.totalSpent')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => {
                                return (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-white/10 hover:bg-white/5 transition cursor-pointer ${selectedUser?.id === user.id ? "bg-white/5" : ""}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                    {user.first_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-white text-sm truncate">{user.first_name} {user.last_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">{user.email}</td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {user.phone_number ? (
                                                <a
                                                    href={`tel:${user.phone_number.replace(/\s/g, '')}`}
                                                    className="hover:text-white transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {user.phone_number}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-xl ${user.role.trim().toLowerCase() === 'admin'
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {getUserOrderCount(user.id)}
                                        </td>
                                        <td className="px-6 py-4 text-white font-semibold text-sm">
                                            {getUserTotalSpent(user.id).toFixed(2)} MDL
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                                        {t('admin.users.noUsers')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                        {t('admin.users.showing')} {paginatedUsers.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} {t('admin.users.to')} {Math.min(currentPage * pageSize, filteredUsers.length)} {t('admin.users.of')} {filteredUsers.length} {t('admin.users.users')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('admin.users.previous')}
                        </button>
                        <div className="text-sm text-gray-300 px-2">
                            {t('admin.users.page')} {currentPage} {t('admin.users.ofPage')} {totalPages || 1}
                        </div>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                        >
                            {t('admin.users.next')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            <UserDetailsModal
                isOpen={selectedUser !== null}
                onClose={() => setSelectedUser(null)}
                user={selectedUser}
                userOrders={selectedUserOrders}
            />

        </div>
    );
};

// User Details Modal Component
interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    userOrders: OrderDisplay[];
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user, userOrders }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    if (!isOpen || !user) return null;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateString || 'N/A';
        }
    };


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
                    onClick={onClose}
                    style={{ zIndex: 10000 }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <h2 className="text-2xl font-bold text-white">{t('admin.users.userDetails')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 md:gap-6">
                                {/* User Info */}
                                <div className="space-y-6">
                                    {/* User Profile */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                            {user.first_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{user.first_name} {user.last_name}</h3>
                                            {user.phone_number ? (
                                                <a
                                                    href={`tel:${user.phone_number.replace(/\s/g, '')}`}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {user.phone_number}
                                                </a>
                                            ) : (
                                                <p className="text-gray-400">N/A</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Information */}
                                    <div className="space-y-4">
                                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.users.email')}</p>
                                            </div>
                                            <p className="text-white font-medium">{user.email}</p>
                                        </div>

                                        {user.phone_number && (
                                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.users.phone')}</p>
                                                </div>
                                                <a
                                                    href={`tel:${user.phone_number.replace(/\s/g, '')}`}
                                                    className="text-white font-medium hover:text-gray-300 transition-colors"
                                                >
                                                    {user.phone_number}
                                                </a>
                                            </div>
                                        )}

                                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.users.role')}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold border backdrop-blur-sm ${user.role.trim().toLowerCase() === 'admin'
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <DollarSign className="h-5 w-5 text-gray-400" />
                                            <p className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.users.totalSpent')}</p>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {userOrders.reduce((sum, order) => sum + (order.amount || 0), 0).toFixed(2)} MDL
                                        </p>
                                    </div>
                                </div>

                                {/* Rental History */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Car className="h-5 w-5 text-gray-400" />
                                        <h4 className="text-lg font-bold text-white">{t('admin.users.rentalHistory')}</h4>
                                        <span className="text-sm text-gray-400">({userOrders.length})</span>
                                    </div>

                                    {userOrders.length > 0 ? (
                                        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                                <table className="w-full text-sm" style={{ minWidth: '100%' }}>
                                                    <thead className="bg-white/5 sticky top-0">
                                                        <tr>
                                                            <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('admin.users.car')}</th>
                                                            <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('admin.users.dates')}</th>
                                                            <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('admin.users.amount')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userOrders.slice(0, 5).map((order) => {
                                                            const car = cars.find(c => c.id.toString() === order.carId);
                                                            return (
                                                                <tr key={order.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                                                    <td className="px-3 md:px-4 py-2 md:py-3 text-white font-medium whitespace-nowrap">
                                                                        {car?.name || order.carName || 'N/A'}
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2 md:py-3 text-gray-300">
                                                                        <div className="flex flex-col md:flex-row md:gap-2 gap-0.5">
                                                                            <span className="whitespace-nowrap">{formatDate(order.pickupDate || order.startDate)}</span>
                                                                            <span className="hidden md:inline whitespace-nowrap">→</span>
                                                                            <span className="whitespace-nowrap">{formatDate(order.returnDate || order.endDate)}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2 md:py-3 text-white font-semibold whitespace-nowrap">
                                                                        {order.amount?.toFixed(2) || '0.00'} MDL
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {userOrders.length > 0 && (
                                                <div className="p-4 border-t border-white/10">
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            navigate(`/admin?section=orders&search=${encodeURIComponent(`${user?.first_name} ${user?.last_name}`)}`);
                                                        }}
                                                        className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 hover:text-blue-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {t('admin.users.viewPastRentals', { name: `${user.first_name} ${user.last_name}` })}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-lg p-12 border border-white/10 text-center">
                                            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-400">{t('admin.users.noRentalHistory')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default UsersPage;

