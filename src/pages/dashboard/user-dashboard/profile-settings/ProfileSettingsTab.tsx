import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfileTab from '../../profile/UserProfile';
import { SettingsTab } from '../settings/UserSettings';
import { TabType } from '../../UserDashboard';

interface ProfileSettingsTabProps {
    t: (key: string) => string;
    activeTab: TabType;
    passwordForm: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    };
    setPasswordForm: (value: any) => void;
    notificationSettings: {
        bookingUpdates: boolean;
        promotions: boolean;
        newsletter: boolean;
    };
    handleNotificationToggle: (key: 'bookingUpdates' | 'promotions' | 'newsletter') => void;
}

type SubTabType = 'profile' | 'settings';

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
    t,
    activeTab,
    passwordForm,
    setPasswordForm,
    notificationSettings,
    handleNotificationToggle,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const subTabFromUrl = searchParams.get('subTab') as SubTabType | null;

    // Initialize with URL value or default
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>(() => {
        if (subTabFromUrl && (subTabFromUrl === 'profile' || subTabFromUrl === 'settings')) {
            return subTabFromUrl;
        }
        return 'profile'; // Default to profile
    });

    // Sync state with URL changes
    useEffect(() => {
        if (subTabFromUrl && (subTabFromUrl === 'profile' || subTabFromUrl === 'settings')) {
            setActiveSubTab(subTabFromUrl);
        }
    }, [subTabFromUrl]);

    // Initialize URL if no subTab is present
    useEffect(() => {
        if (!subTabFromUrl && activeTab === 'settings') {
            setSearchParams({ tab: 'settings', subTab: 'profile' }, { replace: true });
        }
    }, [activeTab, subTabFromUrl, setSearchParams]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('dashboard.settings.title')}</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                <button
                    onClick={() => {
                        setActiveSubTab('profile');
                        setSearchParams({ tab: 'settings', subTab: 'profile' }, { replace: true });
                    }}
                    className={`px-6 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${activeSubTab === 'profile'
                            ? 'text-red-600 border-red-600'
                            : 'text-gray-400 border-transparent hover:text-white'
                        }`}
                >
                    {t('dashboard.sidebar.profile')}
                </button>
                <button
                    onClick={() => {
                        setActiveSubTab('settings');
                        setSearchParams({ tab: 'settings', subTab: 'settings' }, { replace: true });
                    }}
                    className={`px-6 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${activeSubTab === 'settings'
                            ? 'text-red-600 border-red-600'
                            : 'text-gray-400 border-transparent hover:text-white'
                        }`}
                >
                    {t('dashboard.sidebar.settings')}
                </button>
            </div>

            {/* Tab Content */}
            {activeSubTab === 'profile' && (
                <ProfileTab
                    activeTab="profile"
                    t={t}
                />
            )}

            {activeSubTab === 'settings' && (
                <SettingsTab
                    t={t}
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    notificationSettings={notificationSettings}
                    handleNotificationToggle={handleNotificationToggle}
                />
            )}
        </div>
    );
};

