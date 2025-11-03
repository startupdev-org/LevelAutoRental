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
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <main className="flex-1 transition-all duration-300 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                                    {firstName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                                Settings
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your account, profile and preferences
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                // cancel behavior (reset or navigate)
                                console.log("cancel");
                            }}
                            className="px-4 py-2 rounded-md border border-gray-200 bg-white text-xl"
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
                                className="px-4 py-2 rounded-md bg-theme-500 text-white text-bold shadow hover:brightness-95"
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
                                className={`text-sm px-4 py-2 rounded-full transition-all font-medium ${tab === t.key
                                    ? "bg-white shadow text-gray-900"
                                    : "text-gray-600 hover:bg-white/60"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Card container (centered look similar to car details) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    {/* My details */}
                    <TabPanel value={tab} index="my-details">
                        <div className="flex items-start justify-between gap-8">
                            <div className="flex-1 pr-6">
                                <h2 className="text-lg font-semibold mb-4">Personal info</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-2">First name</div>
                                        <input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100"
                                        />
                                    </label>

                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-2">Last name</div>
                                        <input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100"
                                        />
                                    </label>

                                    <label className="md:col-span-2 block">
                                        <div className="text-xs text-gray-500 mb-2">Email address</div>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-100"
                                        />
                                    </label>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={onSaveDetails}
                                        className="px-4 py-2 rounded-md bg-theme-500 text-white font-semibold"
                                    >
                                        Save personal info
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFirstName("");
                                            setLastName("");
                                            setEmail("");
                                        }}
                                        className="px-4 py-2 rounded-md border border-gray-200 bg-white"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <aside className="w-64 shrink-0">
                                <div className="text-sm text-gray-600 mb-3 font-medium">
                                    Your photo
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
                                                {firstName.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="mx-auto">
                                            <input
                                                id="avatar-file"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() =>
                                                    document.getElementById("avatar-file")?.click()
                                                }
                                                className="px-4 py-2 rounded-md bg-white border border-gray-200"
                                            >
                                                Upload photo
                                            </button>
                                        </label>

                                        <button
                                            onClick={() => {
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                            }}
                                            className="px-3 py-2 rounded-md border border-gray-100 bg-white text-sm"
                                        >
                                            Delete
                                        </button>

                                        <p className="text-xs text-gray-400 text-center mt-2">
                                            SVG, PNG, JPG or GIF (max. 800×400px)
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </TabPanel>

                    {/* Profile */}
                    <TabPanel value={tab} index="profile">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <h2 className="text-lg font-semibold mb-4">Profile</h2>

                                <div className="space-y-4">
                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-2">Username</div>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            Visible on your public profile
                                        </div>
                                    </label>

                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-2">Website</div>
                                        <input
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                            placeholder="https://example.com"
                                        />
                                    </label>

                                    <label className="block">
                                        <div className="text-xs text-gray-500 mb-2">Your bio</div>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                            placeholder="Write a short introduction..."
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            {bio.length} characters
                                        </div>
                                    </label>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={onSaveProfile}
                                            className="px-4 py-2 rounded-md bg-theme-500 text-white"
                                        >
                                            Update profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                            }}
                                            className="px-4 py-2 rounded-md border border-gray-200 bg-white"
                                        >
                                            Delete photo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <aside>
                                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                    <div className="text-sm text-gray-600 mb-3">
                                        Public profile preview
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    {firstName.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="font-semibold">
                                                {firstName} {lastName}
                                            </div>
                                            <div className="text-xs text-gray-400">@{username}</div>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </TabPanel>

                    {/* Password */}
                    <TabPanel value={tab} index="password">
                        <h2 className="text-lg font-semibold mb-4">Password</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label>
                                <div className="text-xs text-gray-500 mb-2">Current password</div>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                />
                            </label>

                            <label>
                                <div className="text-xs text-gray-500 mb-2">New password</div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                    Your new password must be more than 8 characters.
                                </div>
                            </label>

                            <label className="md:col-span-2">
                                <div className="text-xs text-gray-500 mb-2">
                                    Confirm new password
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
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
                                className="px-4 py-2 rounded-md border border-gray-200 bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onUpdatePassword}
                                className="px-4 py-2 rounded-md bg-theme-500 text-white"
                            >
                                Update password
                            </button>
                        </div>
                    </TabPanel>

                    {/* Email */}
                    <TabPanel value={tab} index="email">
                        <h2 className="text-lg font-semibold mb-4">Email preferences</h2>
                        <label className="flex items-center justify-between mb-3">
                            <span className="text-sm">Marketing emails</span>
                            <input
                                type="checkbox"
                                checked={marketingEmails}
                                onChange={(e) => setMarketingEmails(e.target.checked)}
                            />
                        </label>

                        <label className="flex items-center justify-between mb-3">
                            <span className="text-sm">Product updates</span>
                            <input
                                type="checkbox"
                                checked={productEmails}
                                onChange={(e) => setProductEmails(e.target.checked)}
                            />
                        </label>
                    </TabPanel>

                    {/* Notifications */}
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
            </main>
        </div>
    );
};

export default Settings;