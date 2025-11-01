import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cars } from '../../../../data/cars';
import { orders } from '../../../../data/index';
import { ChevronRight, UserRound, Calendar, Clock, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { Sidebar } from '../../../../components/layout/Sidebar';


export const OrderDetails: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { orderId } = useParams();
    const navigate = useNavigate();
    const order = orders.find((o) => o.id === orderId);
    const car = order ? cars.slice(0, 4) : null;

    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);

    useEffect(() => {
        if (!order || !car) {
            navigate('/orders'); // redirect if invalid order
        } else {
            setSelectedImage(car.image);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [orderId]);

    if (!order || !car) return null;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_460px] gap-12">
                    {/* LEFT: Order + Car Details */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Order {order.id}
                        </h1>

                        {/* Car Summary */}
                        <div className="flex items-center gap-6 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <img src={selectedImage} alt={car.name} className="w-32 h-20 object-cover rounded-md" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{car.name}</h2>
                                <div className="text-sm text-gray-500">{car.transmission} · {car.seats} seats</div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <div className="text-gray-700 text-sm">
                                        Pickup: {order.pickupDate}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <div className="text-gray-700 text-sm">
                                        Pickup Time: {order.pickupTime || '--:--'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <div className="text-gray-700 text-sm">
                                        Return: {order.returnDate}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <div className="text-gray-700 text-sm">
                                        Return Time: {order.returnTime || '--:--'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <img src={order.avatar} alt={order.customer} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-gray-900 font-semibold">{order.customer}</div>
                                    <div className="text-gray-500 text-sm">{order.customerEmail}</div>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Status */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-gray-700 text-sm">Amount Paid</div>
                                    <div className="text-gray-900 font-semibold text-lg">${order.amount}</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold 
                                    ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {order.status}
                                </div>
                            </div>
                        </div>

                        {/* Notes / Extras */}
                        {order.notes && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
                                <p className="text-gray-700 text-sm">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Actions */}
                    <aside className="lg:col-start-2">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3">
                                <button
                                    className="bg-theme-500 hover:bg-theme-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                                    onClick={() => navigate(`/orders/${order.id}/edit`)}
                                >
                                    Edit Order
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                                    onClick={() => alert('Cancel order action')}
                                >
                                    Cancel Order
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-xl transition-colors"
                                >
                                    <Heart className="w-5 h-5" />
                                    Mark as Favorite
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
