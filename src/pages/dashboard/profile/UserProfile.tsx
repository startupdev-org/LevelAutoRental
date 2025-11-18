import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Mail, Phone, Loader2 } from 'lucide-react';
import { getProfile, updateProfile } from '../../../lib/db/profile';
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

    const resetProfileInfo = () => {
        setEditForm({
            firstName: user?.first_name || '',
            lastName: user?.last_name || '',
            phone: user?.phone_number || '',
        });
        setIsEditing(false)
    }

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
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={initialLoading}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Edit3 size={16} />
                    {isEditing ? t('dashboard.profile.cancel') : t('dashboard.profile.editProfile')}
                </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative min-h-[400px]">
                {/* Initial Loading Overlay */}
                <AnimatePresence>
                    {initialLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl z-20 flex items-center justify-center"
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
                    )}
                </AnimatePresence>

                {/* Save Loading Overlay */}
                <AnimatePresence>
                    {loading && !initialLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl z-20 flex items-center justify-center"
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
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.firstName')}</label>
                        <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[0-9]/g, '');
                                setEditForm({ ...editForm, firstName: value });
                            }}
                            disabled={!isEditing || loading || initialLoading}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.lastName')}</label>
                        <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[0-9]/g, '');
                                setEditForm({ ...editForm, lastName: value });
                            }}
                            disabled={!isEditing || loading || initialLoading}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.phone')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => {
                                    // remove any letters
                                    const value = e.target.value.replace(/[^0-9+]/g, '');
                                    setEditForm({ ...editForm, phone: value });
                                }}
                                disabled={!isEditing || loading || initialLoading}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="relative bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-red-600 flex items-center justify-center gap-2 min-w-[140px] overflow-hidden"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Loader2 className="w-4 h-4" />
                                    </motion.div>
                                    <span>{t('dashboard.profile.saving') || 'Saving...'}</span>
                                </>
                            ) : (
                                t('dashboard.profile.saveChanges')
                            )}
                        </button>

                        <button
                            onClick={() => resetProfileInfo()}
                            disabled={loading}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('dashboard.profile.cancel')}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProfileTab;
