import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Mail, Phone } from 'lucide-react';
import { User } from '../../../types';
import { getProfile } from '../../../lib/db/profile';

interface ProfileTabProps {
    activeTab: string;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    editForm: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    setEditForm: React.Dispatch<
        React.SetStateAction<{
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        }>
    >;
    handleSaveProfile: () => void;
    t: (key: string) => string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
    activeTab,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    handleSaveProfile,
    t,
}) => {

    const [user, setUser] = useState<User | null>(null);

    async function handleGetProfile() {
        const profile = await getProfile(); // rename to avoid shadowing
        setUser(profile);
        // console.log('the profile is: ', profile)
    }


    useEffect(() => {
        handleGetProfile()
    }, []);

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
                            value={user?.first_name}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.lastName')}</label>
                        <input
                            type="text"
                            value={user?.last_name}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('dashboard.profile.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="email"
                                value={user?.email}
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
                                value={user?.phone_number}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleSaveProfile}
                            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all duration-300"
                        >
                            {t('dashboard.profile.saveChanges')}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
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
