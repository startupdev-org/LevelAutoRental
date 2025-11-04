import React, { useEffect, useState } from "react";
import { Sidebar } from "../../../components/layout/Sidebar";

type TabKey =
    | "my-details"
    | "profile"
    | "password"
    | "email"
    | "notifications";

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
    const [tab, setTab] = useState<TabKey>("my-details");

    // Personal / profile state
    const [firstName, setFirstName] = useState("Victorin");
    const [lastName, setLastName] = useState("Levitchi");
    const [email, setEmail] = useState("victorin@levelautorental.com");
    const [username, setUsername] = useState("victorin");
    const [website, setWebsite] = useState("");
    const [bio, setBio] = useState("");

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

    // preferences
    const [marketingEmails, setMarketingEmails] = useState(true);
    const [productEmails, setProductEmails] = useState(true);
    const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(
        "system"
    );

    const tabs: { key: TabKey; label: string }[] = [
        { key: "my-details", label: "My details" },
        { key: "profile", label: "Profile" },
        { key: "password", label: "Password" },
        { key: "email", label: "Email" },
        { key: "notifications", label: "Notifications" },
    ];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setAvatarFile(e.target.files[0]);
    };

    const onSaveDetails = () => {
        console.log("save details", { firstName, lastName, email });
    };

    const onSaveProfile = () => {
        console.log("save profile", { username, website, bio, avatarFile });
    };

    const onUpdatePassword = () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log("update password", { currentPassword, newPassword });
    };

    return (
        <div
            className="space-y-6"
            style={{
                fontFamily:
                    '"Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
        >
            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-red-500/50 shadow-lg mb-4">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-3xl font-bold text-white">
                                    {firstName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{firstName} {lastName}</h3>
                        <p className="text-gray-400 text-sm mb-4">@{username}</p>
                        <div className="space-y-2">
                            <div className="text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                                {email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                        <button
                            onClick={() => {
                                if (tab === "my-details") onSaveDetails();
                                if (tab === "profile") onSaveProfile();
                                if (tab === "password") onUpdatePassword();
                            }}
                            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 text-sm font-semibold hover:border-red-500/60 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
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

                    {/* Content Area */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-6">
                    {/* My details */}
                    <TabPanel value={tab} index="my-details">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">First name</div>
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                </label>

                                <label className="block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">Last name</div>
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                </label>

                                <label className="md:col-span-2 block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">Email address</div>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                </label>
                            </div>
                        </div>
                    </TabPanel>

                    {/* Profile */}
                    <TabPanel value={tab} index="profile">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Profile Settings</h3>
                            <label className="block">
                                <div className="text-sm text-gray-400 font-medium mb-1.5">Username</div>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                    Visible on your public profile
                                </div>
                            </label>
                        </div>
                    </TabPanel>


                    {/* Password */}
                    <TabPanel value={tab} index="password">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                            <div className="space-y-4">
                                <label className="block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">Current password</div>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                </label>

                                <label className="block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">New password</div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        Your new password must be more than 8 characters.
                                    </div>
                                </label>

                                <label className="block">
                                    <div className="text-sm text-gray-400 font-medium mb-1.5">
                                        Confirm new password
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-white"
                                    />
                                </label>
                            </div>
                        </div>
                    </TabPanel>

                    {/* Email */}
                    <TabPanel value={tab} index="email">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Email Preferences</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-300">Marketing emails</span>
                                    <input
                                        type="checkbox"
                                        checked={marketingEmails}
                                        onChange={(e) => setMarketingEmails(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                </label>

                                <label className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-300">Product updates</span>
                                    <input
                                        type="checkbox"
                                        checked={productEmails}
                                        onChange={(e) => setProductEmails(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                </label>
                            </div>
                        </div>
                    </TabPanel>

                    {/* Notifications */}
                    <TabPanel value={tab} index="notifications">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-300">Notify me about new bookings</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                                </label>

                                <label className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-300">Notify me about messages</span>
                                    <input type="checkbox" className="w-4 h-4" />
                                </label>

                                <label className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-300">System alerts</span>
                                    <input type="checkbox" className="w-4 h-4" />
                                </label>
                            </div>
                        </div>
                    </TabPanel>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;