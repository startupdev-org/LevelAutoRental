import React, { useMemo } from 'react';
import { cars } from '../../data/cars';
import { orders } from '../../data/index';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type OrdersTableProps = {
    title: string;
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ title }) => {

    const navigate = useNavigate();

    return (
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-red-500 uppercase tracking-wider text-xs font-semibold">Orders</p>
                    <h2 className="text-2xl font-bold text-gray-800 mt-1">{title}</h2>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs font-semibold bg-gray-100 rounded-full">All orders</span>
                    <span className="px-3 py-1 text-xs font-semibold bg-gray-100 rounded-full">Paid</span>
                    <span className="px-3 py-1 text-xs font-semibold bg-gray-100 rounded-full">Refunded</span>
                </div>
            </div>

            {/* Table */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((o) => (
                        <tr key={o.id} className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => navigate(`/orders/${o.id}`)}

                        >
                            <td className="px-6 py-4 text-gray-800 font-medium">{o.id}</td>
                            <td className="px-6 py-4 text-gray-500">{o.date}</td>
                            <td className="px-6 py-4">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${o.status === 'Paid'
                                        ? 'bg-green-50 text-green-700'
                                        : o.status === 'Pending'
                                            ? 'bg-yellow-50 text-yellow-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                >
                                    {o.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-800 font-medium">${o.amount}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="text-gray-800 font-medium">{o.customer}</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
