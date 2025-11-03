import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sidebar } from "../../../components/layout/Sidebar";

type TabKey =
    | "my-details"
    | "profile"
    | "password"
    | "appearance"
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
    return value === index ? <div className="mt-4">{children}</div> : null;
}

export const Settings: React.FC = () => {
    const [tab, setTab] = useState<TabKey>("my-details");

    // My details / Profile state
    const [firstName, setFirstName] = useState("Victorin");
    const [lastName, setLastName] = useState("Levitchi");
    const [email, setEmail] = useState("victorin@levelautorental.com");
    const [username, setUsername] = useState("victorin");

    // Avatar upload preview
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

    // Password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Preferences
    const [marketingEmails, setMarketingEmails] = useState(true);
    const [productEmails, setProductEmails] = useState(true);

    const onSaveDetails = () => {
        console.log("Save details:", { firstName, lastName, email });
    };

    const onSaveProfile = () => {
        console.log("Save profile:", { username, avatarFile });
    };

    const onUpdatePassword = () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log("Update password", { currentPassword, newPassword });
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: "my-details", label: "My details" },
        { key: "profile", label: "Profile" },
        { key: "password", label: "Password" },
        { key: "email", label: "Email" },
        { key: "notifications", label: "Notifications" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <main className="flex-1 transition-all duration-300 p-8">
                <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {/* Top header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                                        V
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold leading-tight">Settings</h1>
                                <p className="text-sm text-gray-500">Update your account, profile and preferences</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    // cancel - simple refresh of values or navigate back
                                    console.log("cancel");
                                }}
                                className="px-4 py-2 rounded-md border border-gray-200 bg-white text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    if (tab === "my-details") onSaveDetails();
                                    if (tab === "profile") onSaveProfile();
                                    if (tab === "password") onUpdatePassword();
                                }}
                                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm shadow"
                            >
                                Save changes
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6">
                        <nav className="flex flex-wrap gap-2">
                            {tabs.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`text-sm px-3 py-2 rounded-full transition ${tab === t.key
                                        ? "bg-white shadow text-gray-900"
                                        : "text-gray-600 hover:bg-white/50"
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content card */}
                    <div className="bg-white rounded-2xl p-8 shadow-md">
                        <TabPanel value={tab} index="my-details">
                            <h2 className="text-lg font-semibold mb-4">Personal info</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="block">
                                            <div className="text-xs text-gray-500 mb-1">First name</div>
                                            <input
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                                            />
                                        </label>

                                        <label className="block">
                                            <div className="text-xs text-gray-500 mb-1">Last name</div>
                                            <input
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                                            />
                                        </label>
                                    </div>

                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-1">Email address</div>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                                        />
                                    </label>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel value={tab} index="profile">
                            <h2 className="text-lg font-semibold mb-4">Profile</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <label>
                                        <div className="text-xs text-gray-500 mb-1">Username</div>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">Visible on your public profile</div>
                                    </label>

                                    <div className="flex gap-3">
                                        <button onClick={onSaveProfile} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Update profile</button>
                                        <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="px-4 py-2 rounded-md border border-gray-200 bg-white">Delete photo</button>
                                    </div>
                                </div>

                                <div>
                                    <div className="border border-gray-100 rounded-md p-4">
                                        <div className="text-sm text-gray-500 mb-3">Public profile preview</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                                                {avatarPreview ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">O</div>}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{firstName} {lastName}</div>
                                                <div className="text-xs text-gray-400">@{username}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel value={tab} index="password">
                            <h2 className="text-lg font-semibold mb-4">Password</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-1">Current password</div>
                                        <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50" />
                                    </label>

                                    <label className="block mt-3">
                                        <div className="text-xs text-gray-500 mb-1">New password</div>
                                        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50" />
                                        <div className="text-xs text-gray-400 mt-1">Your new password must be more than 8 characters.</div>
                                    </label>

                                    <label className="block mt-3">
                                        <div className="text-xs text-gray-500 mb-1">Confirm new password</div>
                                        <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50" />
                                    </label>

                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="px-4 py-2 rounded-md border border-gray-200 bg-white">Cancel</button>
                                        <button onClick={onUpdatePassword} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Update password</button>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel value={tab} index="email">
                            <h2 className="text-lg font-semibold mb-4">Email preferences</h2>
                            <label className="flex items-center justify-between mb-3">
                                <span className="text-sm">Marketing emails</span>
                                <input type="checkbox" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} />
                            </label>
                            <label className="flex items-center justify-between mb-3">
                                <span className="text-sm">Product updates</span>
                                <input type="checkbox" checked={productEmails} onChange={(e) => setProductEmails(e.target.checked)} />
                            </label>
                        </TabPanel>

                        <TabPanel value={tab} index="notifications">
                            <h2 className="text-lg font-semibold mb-4">Notifications</h2>

                            <label className="flex items-center justify-between mb-3">
                                <span className="text-sm">Notify me about new bookings</span>
                                <input type="checkbox" defaultChecked />
                            </label>

                            <label className="flex items-center justify-between mb-3">
                                <span className="text-sm">Notify me about messages</span>
                                <input type="checkbox" />
                            </label>

                            <label className="flex items-center justify-between mb-3">
                                <span className="text-sm">System alerts</span>
                                <input type="checkbox" />
                            </label>
                        </TabPanel>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;