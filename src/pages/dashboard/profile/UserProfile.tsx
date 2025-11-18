import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Mail, Phone } from 'lucide-react';
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

    // Fetch profile
    async function handleGetProfile() {
        const profile = await getProfile();
        if (profile) {
            setUser(profile);
            setEditForm({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                phone: profile.phone_number || '',
            });
        }
    }

    useEffect(() => {
        handleGetProfile();
    }, []);

    // Save profile
    const handleSaveProfile = async () => {
        if (!user) return;

        setLoading(true);
        // const result = await updateProfile({
        //     id: user.id,
        //     first_name: editForm.firstName,
        //     last_name: editForm.lastName,
        //     phone_number: editForm.phone,
        // });

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
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                    <Edit3 size={16} />
                    {isEditing ? t('dashboard.profile.cancel') : t('dashboard.profile.editProfile')}
                </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
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
                            disabled={!isEditing || loading}
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
                            disabled={!isEditing || loading}
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
                                disabled={!isEditing || loading}
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
                            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all duration-300"
                        >
                            {loading ? t('dashboard.profile.saving') : t('dashboard.profile.saveChanges')}
                        </button>

                        <button
                            onClick={() => resetProfileInfo()}
                            disabled={loading}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-all duration-300"
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
