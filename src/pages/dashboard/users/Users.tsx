import React, { useState } from "react";
import { User } from "../../../types";
import { users as usersData } from "../../../data/index"
import { ArrowLeft, ArrowRight } from "lucide-react";

export const UsersPage: React.FC = () => {
  const [users] = useState<User[]>(usersData);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of users per page

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
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: '"Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Users
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-1 max-w-xl">
                Manage users
            </p>
        </div>
        <button className="px-4 py-2 bg-theme-500 text-white font-semibold rounded-md shadow hover:brightness-95">
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // reset page on search
          }}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-100"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500">User</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500">Role</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                    {user.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>
                    <span className="text-gray-400 text-sm">@{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{user.email}</td>
                <td className="px-6 py-4 text-gray-700">{user.role}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-theme-500 font-semibold hover:underline mr-2">Edit</button>
                  <button className="text-red-500 font-semibold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between max-w-lg mx-auto px-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
        >
          <span className="text-sm">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium">Previous</span>
        </button>

        <div className="text-sm text-gray-600 font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
        >
          <span className="text-sm font-medium">Next</span>
          <span className="text-sm">
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default UsersPage;