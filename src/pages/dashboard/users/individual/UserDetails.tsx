
import React from "react";
import { User } from "../../../../types";
import { orders } from "../../../../data";
import { Car, Mail, User as UserIcon } from "lucide-react";

interface UserDetailsProps {
    selectedUser: User | null;
}

export const userBorrowHistory = (user: User) => {
    return orders.filter(order => order.customerId === user.id);
};

export const UserDetails: React.FC<UserDetailsProps> = ({ selectedUser }) => {
    return (
        <>
            <div className="w-1/3 sticky top-8 h-fit">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                    </div>
                    <div className="p-6 flex-1">
                        {selectedUser ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-2xl">
                                        {selectedUser.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                        <div className="text-gray-400">@{selectedUser.username}</div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-gray-700">
                                        <Mail className="h-5 w-5 mr-2 text-gray-400" />
                                        <span>{selectedUser.email}</span>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                                        <span>Role: {selectedUser.role}</span>
                                    </div>
                                    {userBorrowHistory(selectedUser).length > 0 && (
                                        <>
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <Car className="h-5 w-5 mr-2 text-gray-400" />
                                                <span className="font-semibold">Borrow History</span>
                                            </div>

                                            {/* Table */}
                                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                                <table className="min-w-full bg-white">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left px-4 py-2 text-sm font-semibold text-gray-500">Date</th>
                                                            <th className="text-left px-4 py-2 text-sm font-semibold text-gray-500">Status</th>
                                                            <th className="text-left px-4 py-2 text-sm font-semibold text-gray-500">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userBorrowHistory(selectedUser).map((order) => (
                                                            <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                                                <td className="px-4 py-2 text-gray-700">{order.date}</td>
                                                                <td className="px-4 py-2 text-gray-700">{order.status}</td>
                                                                <td className="px-4 py-2 text-gray-700">${order.amount}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        ) : (
                            <div className="text-gray-500 text-center mt-8">
                                Select a user to see details.
                            </div>
                        )}
                    </div>
                </div >
            </div >
        </>
    )
}