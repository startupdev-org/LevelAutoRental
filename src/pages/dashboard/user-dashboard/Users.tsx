import React, { useState } from "react";
import { User } from "../../../types";
import { users as usersData } from "../../../data/index";
import { ArrowLeft, ArrowRight, Mail, Car, User as UserIcon } from "lucide-react";
import { orders } from "../../../data";

export const userBorrowHistory = (user: User) => {
    return orders.filter(order => order.customerId === user.id);
};

export const UsersPage: React.FC = () => {
    const [users] = useState<User[]>(usersData);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const pageSize = 5;

    // Filtered users
    const filteredUsers = users.filter(
        (u) =>
            u.first_name.toLowerCase().includes(search.toLowerCase()) ||
            u.last_name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            {/* Users Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="flex-1 max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                            />
                            <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap">
                                + Add User
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => (
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
                                                <span className="text-gray-400 text-xs truncate">@{user.username}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-xl bg-blue-500/20 text-blue-300 border-blue-500/50">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                            View Details →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                        Showing {paginatedUsers.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <div className="text-sm text-gray-300 px-2">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected User Details */}
            {selectedUser && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">User Details</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* User Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                        {selectedUser.first_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">{selectedUser.first_name} {selectedUser.last_name}</h4>
                                        <p className="text-gray-400">@{selectedUser.username}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm">{selectedUser.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm">Role: <span className="font-semibold text-white">{selectedUser.role}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Borrow History */}
                            {userBorrowHistory(selectedUser).length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Car className="h-5 w-5 text-gray-400" />
                                        <h5 className="font-semibold text-white">Rental History</h5>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-white/20 bg-white/5">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5">
                                                <tr>
                                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Date</th>
                                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Status</th>
                                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userBorrowHistory(selectedUser).map((order) => (
                                                    <tr key={order.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                                        <td className="px-4 py-2 text-gray-300">{order.date}</td>
                                                        <td className="px-4 py-2 text-gray-300">{order.status}</td>
                                                        <td className="px-4 py-2 text-gray-300">${order.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
