import React, { useEffect, useState, useMemo } from 'react';
import { cars } from '../../../../data/cars';
import { OrderDisplay } from '../../../../lib/orders';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Order Form Modal Component
interface OrderFormModalProps {
    onSave: (orderData: Partial<OrderDisplay>) => void;
    onClose: () => void;
}

export const UserOrderFormModal: React.FC<OrderFormModalProps> = ({ onSave, onClose }) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const [formData, setFormData] = useState<Partial<OrderDisplay>>({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        carId: '',
        carName: '',
        startDate: today.toISOString().split('T')[0],
        startTime: '09:00',
        endDate: tomorrow.toISOString().split('T')[0],
        endTime: '17:00',
        status: 'ACTIVE',
        amount: 0,
    });

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId) return 0;
        const selectedCar = cars.find(c => c.id.toString() === formData.carId);
        if (!selectedCar) return 0;

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        return selectedCar.pricePerDay * days;
    };

    useEffect(() => {
        const amount = calculateAmount();
        setFormData(prev => ({ ...prev, amount }));
    }, [formData.startDate, formData.endDate, formData.carId]);

    const handleCarChange = (carId: string) => {
        const selectedCar = cars.find(c => c.id.toString() === carId);
        setFormData(prev => ({
            ...prev,
            carId,
            carName: selectedCar?.name || '',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerName || !formData.carId) {
            alert('Please fill in all required fields');
            return;
        }
        onSave(formData);
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-xl font-bold text-white">Add New Order</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name *</label>
                                <input
                                    type="text"
                                    value={formData.customerName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.customerPhone || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Selection */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Vehicle Selection</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Car *</label>
                            <select
                                value={formData.carId || ''}
                                onChange={(e) => handleCarChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            >
                                <option value="">Select a car...</option>
                                {cars.map((car) => (
                                    <option key={car.id} value={car.id.toString()}>
                                        {car.name} - {car.pricePerDay} MDL/day
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Rental Period */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Rental Period</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                                <input
                                    type="time"
                                    value={formData.startTime || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                                <input
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    min={formData.startDate}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                                <input
                                    type="time"
                                    value={formData.endTime || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status & Amount */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Status & Amount</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                                <select
                                    value={formData.status || 'ACTIVE'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (MDL)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount || 0}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    readOnly
                                />
                                <p className="text-xs text-gray-400 mt-1">Calculated automatically based on rental period</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Add Order
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};