import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Edit3, Mail, Phone, Loader2, AlertTriangle, X } from 'lucide-react';
import { getProfile, updateProfile } from '../../../lib/db/user/profile';
import { User } from '../../../types';

interface ProfileTabProps {
    activeTab: string;
    t: (key: string) => string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ activeTab, t }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showDiscardModal, setShowDiscardModal] = useState(false);

    // Fetch profile
    async function handleGetProfile() {
        setInitialLoading(true);
        try {
            const profile = await getProfile();
            if (profile) {
                setUser(profile);
                setEditForm({
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    phone: profile.phone_number || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setInitialLoading(false);
        }
    }

    useEffect(() => {
        handleGetProfile();
    }, []);

    // Save profile
    const handleSaveProfile = async () => {
        if (!user) return;

        setLoading(true);
        const result = await updateProfile({
            id: user.id,
            first_name: editForm.firstName,
            last_name: editForm.lastName,
            phone_number: editForm.phone
        })


        if (result.success && result.data) {
            setUser(result.data[0]); // update state with new profile
            setIsEditing(false);
        } else {
            alert('Failed to update profile: ' + result.error);
        }
        setLoading(false);
    };

    // Check if there are unsaved changes
    const hasUnsavedChanges = () => {
        if (!user || !isEditing) return false;
        return (
            editForm.firstName !== (user.first_name || '') ||
            editForm.lastName !== (user.last_name || '') ||
            editForm.phone !== (user.phone_number || '')
        );
    };

    const resetProfileInfo = () => {
        setEditForm({
            firstName: user?.first_name || '',
            lastName: user?.last_name || '',
            phone: user?.phone_number || '',
        });
        setIsEditing(false);
        setShowDiscardModal(false);
    };

    const handleCancelEdit = () => {
        if (hasUnsavedChanges()) {
            setShowDiscardModal(true);
        } else {
            resetProfileInfo();
        }
    };

    const handleConfirmDiscard = () => {
        resetProfileInfo();
    };

    const handleCancelDiscard = () => {
        setShowDiscardModal(false);
    };

    if (activeTab !== 'profile') return null;

    return (
        <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">


                <h2 className="text-4xl font-bold text-white">{t('dashboard.profile.title')}</h2>
                <button
                    onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                    disabled={initialLoading}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                >
                    <Edit3 size={18} />
                    {isEditing ? t('dashboard.profile.cancel') : t('dashboard.profile.editProfile')}
                </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative min-h-[400px]">
                {/* Initial Loading Overlay */}
                <AnimatePresence>
                    {initialLoading && (
                        <>
                            {/* Blurred Background Layer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-xl rounded-2xl z-20"
                            />
                            {/* Content Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 rounded-2xl z-30 flex items-center justify-center pointer-events-none"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="relative">
                                        {/* Outer ring */}
                                        <motion.div
                                            className="w-16 h-16 rounded-full border-4 border-red-500/20"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                        {/* Inner spinner */}
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-red-600/50"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        {/* Center dot */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                        </div>
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-white/90 font-medium text-sm"
                                    >
                                        {t('dashboard.profile.loading') || 'Loading profile...'}
                                    </motion.p>
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Save Loading Overlay */}
                <AnimatePresence>
                    {loading && !initialLoading && (
                        <>
                            {/* Blurred Background Layer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-xl rounded-2xl z-20"
                            />
                            {/* Content Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 rounded-2xl z-30 flex items-center justify-center pointer-events-none"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="relative">
                                        {/* Outer ring */}
                                        <motion.div
                                            className="w-16 h-16 rounded-full border-4 border-red-500/20"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                        {/* Inner spinner */}
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-red-600/50"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        {/* Center dot */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                        </div>
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-white/90 font-medium text-sm"
                                    >
                                        {t('dashboard.profile.saving') || 'Saving...'}
                                    </motion.p>
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-bold text-gray-200 mb-3">{t('dashboard.profile.firstName')}</label>
                        <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[0-9]/g, '');
                                setEditForm({ ...editForm, firstName: value });
                            }}
                            disabled={!isEditing || loading || initialLoading}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-bold text-gray-200 mb-3">{t('dashboard.profile.lastName')}</label>
                        <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[0-9]/g, '');
                                setEditForm({ ...editForm, lastName: value });
                            }}
                            disabled={!isEditing || loading || initialLoading}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-bold text-gray-200 mb-3">{t('dashboard.profile.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white text-base placeholder-gray-400 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-bold text-gray-200 mb-3">{t('dashboard.profile.phone')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => {
                                    // remove any letters
                                    const value = e.target.value.replace(/[^0-9+]/g, '');
                                    setEditForm({ ...editForm, phone: value });
                                }}
                                disabled={!isEditing || loading || initialLoading}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="px-3 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg hover:border-green-500/60 transition-all text-m whitespace-nowrap flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Loader2 className="w-5 h-5" />
                                    </motion.div>
                                    <span>{t('dashboard.profile.saving') || 'Saving...'}</span>
                                </>
                            ) : (
                                t('dashboard.profile.saveChanges')
                            )}
                        </button>

                        <button
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                        >
                            {t('dashboard.profile.cancel')}
                        </button>
                    </div>
                )}
            </div>

            {/* Discard Changes Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {showDiscardModal && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                                onClick={handleCancelDiscard}
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-md w-full">
                                    {/* Header */}
                                    <div className="px-6 py-5 border-b border-white/20 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">
                                                {t('dashboard.profile.discardChanges') || 'Discard Changes?'}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={handleCancelDiscard}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <X className="w-6 h-6 text-white/70" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="px-6 py-5">
                                        <p className="text-white/80 text-base leading-relaxed font-medium">
                                            {t('dashboard.profile.discardChangesMessage') ||
                                                'You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.'}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-5 border-t border-white/20 flex items-center justify-end gap-3">
                                        <button
                                            onClick={handleCancelDiscard}
                                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-300 font-semibold rounded-lg hover:border-gray-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                                        >
                                            {t('dashboard.profile.keepEditing') || 'Keep Editing'}
                                        </button>
                                        <button
                                            onClick={handleConfirmDiscard}
                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                                        >
                                            {t('dashboard.profile.discard') || 'Discard Changes'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

export default ProfileTab;
