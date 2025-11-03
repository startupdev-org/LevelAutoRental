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
            className="min-h-screen bg-gray-50 text-gray-900"
            style={{
                fontFamily:
                    '"Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
        >
            <main className="flex-1 transition-all duration-300 p-4 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-white shadow">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">
                                    {firstName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                                Settings
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-1 max-w-xl">
                                Manage your account, profile and preferences
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                console.log("cancel");
                            }}
                            className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white text-sm sm:text-base font-semibold text-gray-900"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (tab === "my-details") onSaveDetails();
                                    if (tab === "profile") onSaveProfile();
                                    if (tab === "password") onUpdatePassword();
                                }}
                                className="px-4 sm:px-5 py-2 sm:py-3 rounded-md bg-theme-500 text-white text-sm sm:text-base font-bold shadow hover:brightness-95"
                            >
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs (centered) */}
                <div className="mb-6 flex justify-center">
                    <nav className="inline-flex bg-transparent gap-2 p-1 rounded-full">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`text-base sm:text-lg px-4 sm:px-5 py-2 rounded-full transition-all font-medium ${tab === t.key
                                    ? "bg-white shadow text-gray-900"
                                    : "text-gray-600 hover:bg-white/60"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Card container */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mx-auto max-w-6xl">
                    {/* My details */}
                    <TabPanel value={tab} index="my-details">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                            <div className="flex-1 pr-0 lg:pr-6">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                                    Personal info
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                                    <label className="block">
                                        <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">First name</div>
                                        <input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100 text-base sm:text-lg"
                                        />
                                    </label>

                                    <label className="block">
                                        <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">Last name</div>
                                        <input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100 text-base sm:text-lg"
                                        />
                                    </label>

                                    <label className="md:col-span-2 block">
                                        <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">Email address</div>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100 text-base sm:text-lg"
                                        />
                                    </label>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        onClick={onSaveDetails}
                                        className="px-4 sm:px-5 py-2 sm:py-3 rounded-md bg-theme-500 text-white font-semibold text-base sm:text-lg"
                                    >
                                        Save personal info
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFirstName("");
                                            setLastName("");
                                            setEmail("");
                                        }}
                                        className="px-4 sm:px-5 py-2 sm:py-3 rounded-md border border-gray-200 bg-white text-base sm:text-lg"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabPanel>

                    {/* Profile */}
                    <TabPanel value={tab} index="profile">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Form */}
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-6">Profile</h2>

                                <div className="space-y-5">
                                    <label className="block">
                                        <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">Username</div>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 text-base sm:text-lg"
                                        />
                                        <div className="text-xs sm:text-sm text-gray-400 font-semibold mt-2">
                                            Visible on your public profile
                                        </div>
                                    </label>

                                    <button
                                        onClick={onSaveProfile}
                                        className="px-4 sm:px-5 py-2 sm:py-3 rounded-md bg-theme-500 text-white font-semibold text-base sm:text-lg"
                                    >
                                        Update profile
                                    </button>
                                </div>
                            </div>

                            {/* Public profile preview */}
                            <aside className="flex justify-center lg:justify-start items-center">
                                <div className="border border-gray-100 rounded-lg p-4 font-semibold bg-gray-50 w-full max-w-sm flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-500 text-xl font-bold">{firstName.charAt(0)}</span>
                                        )}
                                    </div>

                                    {/* Name and username */}
                                    <div className="flex flex-col">
                                        <div className="font-semibold text-base sm:text-lg">
                                            {firstName} {lastName}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400">@{lastName.charAt(0).toLowerCase()}{username}</div>
                                    </div>
                                </div>
                            </aside>

                        </div>
                    </TabPanel>


                    {/* Password */}
                    <TabPanel value={tab} index="password">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Password</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label>
                                <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">Current password</div>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 text-base sm:text-lg"
                                />
                            </label>

                            <label>
                                <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">New password</div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 text-base sm:text-lg"
                                />
                                <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                    Your new password must be more than 8 characters.
                                </div>
                            </label>

                            <label className="md:col-span-2">
                                <div className="text-sm sm:text-base text-gray-500 font-semibold mb-2">
                                    Confirm new password
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg bg-gray-50 text-base sm:text-lg"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}
                                className="px-4 sm:px-5 py-2 sm:py-3 rounded-md border border-gray-200 font-medium bg-white text-base sm:text-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onUpdatePassword}
                                className="px-4 sm:px-5 py-2 sm:py-3 rounded-md bg-theme-500 font-medium text-white  text-base sm:text-lg"
                            >
                                Update password
                            </button>
                        </div>
                    </TabPanel>

                    {/* Email */}
                    <TabPanel value={tab} index="email">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Email preferences</h2>
                        <label className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg">Marketing emails</span>
                            <input
                                type="checkbox"
                                checked={marketingEmails}
                                onChange={(e) => setMarketingEmails(e.target.checked)}
                            />
                        </label>

                        <label className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg">Product updates</span>
                            <input
                                type="checkbox"
                                checked={productEmails}
                                onChange={(e) => setProductEmails(e.target.checked)}
                            />
                        </label>
                    </TabPanel>

                    {/* Notifications */}
                    <TabPanel value={tab} index="notifications">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Notifications</h2>

                        <label className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg">Notify me about new bookings</span>
                            <input type="checkbox" defaultChecked />
                        </label>

                        <label className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg">Notify me about messages</span>
                            <input type="checkbox" />
                        </label>

                        <label className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg">System alerts</span>
                            <input type="checkbox" />
                        </label>
                    </TabPanel>
                </div>
            </main>
        </div>
    );
};

export default Settings;