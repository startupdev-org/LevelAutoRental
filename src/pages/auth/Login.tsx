import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";
import { Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: handle login
        console.log("login", { email, password });
    };

    return (
        <section 
            className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 md:py-12 relative"
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
                        backgroundImage: "url('/LevelAutoRental/backgrounds/bg5-desktop.jpeg')",
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
                            {t("auth.login.left-part.smallLabel")}
                        </h3>
                        <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight drop-shadow">
                            {t("auth.login.left-part.label")}
                        </h2>
                        <p className="mt-4 text-gray-200 max-w-sm">
                            {t("auth.login.left-part.description")}
                        </p>

                        <div className="mt-8 flex items-center gap-3">
                            {/* <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="p-6 md:p-16 flex items-center justify-center min-h-[600px]">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-red-600">{t("auth.login.right-part.label")}</h1>
                            <p className="text-sm text-gray-500 mt-2">
                                {t("auth.login.right-part.description")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">{t("auth.login.right-part.email")}</span>
                                <div className="mt-2 relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder={t("auth.login.right-part.email-example")}
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">{t("auth.login.right-part.password")}</span>
                                <div className="mt-2 relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder={t("auth.login.right-part.enter-password")}
                                    />
                                </div>
                            </label>

                            <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-3 text-sm text-gray-600 cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only" 
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                            rememberMe 
                                                ? 'bg-red-600 border-red-600' 
                                                : 'border-gray-300 group-hover:border-red-400'
                                        }`}>
                                            <svg 
                                                className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                    rememberMe ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`}
                                                fill="currentColor" 
                                                viewBox="0 0 20 20"
                                            >
                                                <path 
                                                    fillRule="evenodd" 
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                                    clipRule="evenodd" 
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    {t("auth.login.right-part.remember-me")}
                                </label>
                                <Link to="/auth/forgot" className="text-sm text-red-600 hover:underline">
                                    {t("auth.login.right-part.forgot-password")}
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md"
                            >
                                {t("auth.login.right-part.login")}
                            </button>
                        </form>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className="text-xs text-gray-400 uppercase">{t("auth.login.right-part.or")}</div>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/auth/signup"
                                className="inline-block px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg bg-white transition transform duration-200 ease-out hover:bg-red-600 hover:text-white hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-200"
                            >
                                {t("auth.login.right-part.create-account")}
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};