import React, { useEffect, useState } from "react";
import { User, Lock, Save } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

type TabKey =
    | "profile"
    | "password";

function TabPanel({
    children,
    value,
    index,
}: {
    children?: React.ReactNode;
    value: TabKey;
    index: TabKey;
}) {
    return value === index ? <div className="mt-6">{children}</div> : null;
}

export const Settings: React.FC = () => {
    const { userProfile, user } = useAuth();
    const [tab, setTab] = useState<TabKey>("profile");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Personal / profile state - initialized from userProfile
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [bio, setBio] = useState("");

    // Initialize form data from userProfile when it loads
    useEffect(() => {
        if (userProfile) {
            setFirstName(userProfile.first_name || "");
            setLastName(userProfile.last_name || "");
            setEmail(userProfile.email || user?.email || "");
            setPhone(userProfile.phone_number || "");
        } else if (user?.email) {
            // Fallback to user email if profile not loaded yet
            setEmail(user.email);
        }
    }, [userProfile, user]);

    // avatar
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreview(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    // load Montserrat (presentation only)
    useEffect(() => {
        const id = "montserrat-font";
        if (!document.getElementById(id)) {
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href =
                "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap";
            document.head.appendChild(link);
        }
    }, []);

    // password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const tabs: { key: TabKey; label: string }[] = [
        { key: "profile", label: "Profile" },
        { key: "password", label: "Password" },
    ];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setAvatarFile(e.target.files[0]);
    };

    const onSaveProfile = async () => {
        if (!userProfile?.id && !user?.id) {
            setSaveMessage({ type: 'error', text: 'User not found' });
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const userId = userProfile?.id || user?.id;
            if (!userId) {
                throw new Error('User ID not found');
            }

            const { error } = await supabase
                .from('Profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone_number: phone || null,
                })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            // Clear message after 3 seconds
            setTimeout(() => {
                setSaveMessage(null);
            }, 3000);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setSaveMessage({ 
                type: 'error', 
                text: error?.message || 'Failed to update profile. Please try again.' 
            });
            
            // Clear error message after 5 seconds
            setTimeout(() => {
                setSaveMessage(null);
            }, 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const onUpdatePassword = () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log("update password", { currentPassword, newPassword });
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key
                            ? "bg-red-500/20 border border-red-500/50 text-white"
                            : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            <TabPanel value={tab} index="profile">
                {saveMessage && (
                    <div className={`mb-4 p-4 rounded-lg border ${
                        saveMessage.type === 'success' 
                            ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                            : 'bg-red-500/20 border-red-500/50 text-red-300'
                    }`}>
                        {saveMessage.text}
                    </div>
                )}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Prenume</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nume</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onSaveProfile}
                        disabled={isSaving}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </TabPanel>

            {/* Password Tab */}
            <TabPanel value={tab} index="password">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Change Password
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Current password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Your new password must be more than 8 characters.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onUpdatePassword}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Update Password
                    </button>
                </div>
            </TabPanel>
        </div>
    );
};

export default Settings;