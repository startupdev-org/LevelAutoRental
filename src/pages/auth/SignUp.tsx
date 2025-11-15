import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";
import { Mail, Lock, UserRound, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { createUser } from "../../lib/db/auth/auth";

export const SignUp: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation();
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);


        try {
            const { data, error: signUpError } = await signUp(email, password);

            // verify the signUp and the id
            if (signUpError || !data?.user?.id) {
                setError(signUpError?.message || "Failed to create account");
                setLoading(false);
                return;
            }

            const id = data.user.id;

            // Insert profile into your 'profiles' table
            await createUser({
                id,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                email,
                role: "USER",
            });

            // Redirect to dashboard
            navigate("/dashboard");
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            className="min-h-[calc(100vh+150px)] md:min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 md:py-12 relative"
        >
            {/* Mobile Background */}
            <div
                className="absolute inset-0 md:hidden"
                style={{
                    backgroundImage: "url('/LevelAutoRental/bg-hero.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            />
            {/* Desktop Background */}
            <div
                className="hidden md:block absolute inset-0"
                style={{
                    backgroundImage: "url('/LevelAutoRental/bg-hero.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            />
            {/* Desktop overlay - darker */}
            <div
                className="hidden md:block absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85))'
                }}
            />
            {/* Mobile-specific overlay */}
            <div
                className="absolute inset-0 md:hidden"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85))'
                }}
            />
            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="w-full max-w-6xl bg-white rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10"
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Left - Image */}
                <div
                    className="relative hidden md:block bg-cover bg-center min-h-[600px]"
                    style={{
                        backgroundImage: "url('/LevelAutoRental/lvl_bg.png')",
                        minHeight: "560px",
                    }}
                >
                    <div className="absolute inset-0 bg-black/70" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(315deg, rgba(220, 38, 38, 0.3), rgba(0, 0, 0, 0.4))'
                        }}
                    />
                    <div className="relative z-10 h-full flex flex-col items-start justify-center p-10 text-white">
                        <h3 className="text-sm font-semibold tracking-wider text-red-600 uppercase">
                            {t("auth.register.left-part.smallLabel")}
                        </h3>
                        <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight drop-shadow">
                            {t("auth.register.left-part.label")}
                        </h2>
                        <p className="mt-4 text-gray-200 max-w-sm">
                            {t("auth.register.left-part.description")}
                        </p>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="p-6 md:p-16 flex items-center justify-center min-h-[600px]">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-red-600">
                                {t("auth.register.right-part.label")}
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                {t("auth.register.right-part.description")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* First + Last name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs font-medium text-gray-700">
                                        {t("auth.register.right-part.first-name")}
                                    </span>
                                    <div className="mt-2 relative">
                                        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                            placeholder={t("auth.register.right-part.first-name-placeholder")}
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="text-xs font-medium text-gray-700">
                                        {t("auth.register.right-part.last-name")}
                                    </span>
                                    <div className="mt-2 relative">
                                        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                            placeholder={t("auth.register.right-part.last-name-placeholder")}
                                        />
                                    </div>
                                </label>
                            </div>

                            {/* Email */}
                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">
                                    {t("auth.register.right-part.email")}
                                </span>
                                <div className="mt-2 relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder={t("auth.register.right-part.email-placeholder")}
                                    />
                                </div>
                            </label>

                            {/* Phone */}
                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">
                                    {t("auth.register.right-part.phone")}
                                </span>
                                <div className="mt-2 relative">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder="+373 62 000 112"
                                    />
                                </div>
                            </label>

                            {/* Password */}
                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">
                                    {t("auth.register.right-part.password")}
                                </span>
                                <div className="mt-2 relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-10 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder={t("auth.register.right-part.enter-password")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 p-1 rounded"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </label>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    t("auth.register.right-part.join-us")
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className="text-xs text-gray-400 uppercase">
                                {t("auth.register.right-part.or")}
                            </div>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Already have an account */}
                        <div className="mt-6 text-center">
                            <Link
                                to="/auth/login"
                                className="inline-block px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg bg-white transition transform duration-200 ease-out hover:bg-red-600 hover:text-white hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-200"
                            >
                                {t("auth.register.right-part.already-have-account")}
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
