import React, { useState } from "react";
import { User } from "../../../types";
import { users as usersData } from "../../../data/index";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { UserDetails } from "./individual/UserDetails";

export const UsersPage: React.FC = () => {
    const [users] = useState<User[]>(usersData);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const pageSize = 5;

    // Filtered users
    const filteredUsers = users.filter(
        (u) =>
            u.firstName.toLowerCase().includes(search.toLowerCase()) ||
            u.lastName.toLowerCase().includes(search.toLowerCase()) ||
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
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        Users
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-1 max-w-xl">
                        Manage users
                    </p>
                </div>
                <button className="px-4 py-2 bg-theme-500 text-white font-semibold rounded-md shadow hover:brightness-95 w-full sm:w-auto">
                    Add User
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 w-full sm:w-1/2 md:w-1/3">
                <input
                    type="text"
                    placeholder="Search users by name or email ..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-100"
                />
            </div>

            {/* Main content: Table + Selected User Panel */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Users Table */}
                <div className="w-full lg:w-2/3 flex flex-col">
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                        <table className="min-w-[450px] w-full bg-white text-xs sm:text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-2 sm:px-3 py-1 sm:py-2 font-semibold text-gray-500">User</th>
                                    <th className="text-left px-2 sm:px-3 py-1 sm:py-2 font-semibold text-gray-500">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer ${selectedUser?.id === user.id ? "bg-gray-100" : ""}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="px-2 sm:px-3 py-1 sm:py-2 flex items-center gap-2 sm:gap-3 min-w-[120px]">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs sm:text-sm">
                                                {user.firstName.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 text-xs sm:text-sm">{user.firstName} {user.lastName}</span>
                                                <span className="text-gray-400 text-[10px] sm:text-xs">@{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-gray-700 min-w-[160px] text-xs sm:text-sm">{user.email}</td>
                                    </tr>
                                ))}
                                {paginatedUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-2 py-2 text-center text-gray-400 text-xs sm:text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 px-1 sm:px-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50 w-full sm:w-auto justify-center text-xs sm:text-sm"
                        >
                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Previous</span>
                        </button>

                        <div className="text-xs sm:text-sm text-gray-600 font-medium">
                            Page {currentPage} of {totalPages || 1}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50 w-full sm:w-auto justify-center text-xs sm:text-sm"
                        >
                            <span>Next</span>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>



                {/* Selected User Panel */}
                {selectedUser && (
                    <UserDetails selectedUser={selectedUser} />
                )}

            </div>

        </div >
    );
};

export default UsersPage;
