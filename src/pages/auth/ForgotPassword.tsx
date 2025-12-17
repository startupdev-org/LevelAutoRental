import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sendForgotPasswordEmail } from "../../lib/db/auth/auth";

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        sendForgotPasswordEmail(email)

        
        setIsSubmitted(true);
    };

    return (
        <section
            className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 md:py-12 relative"
        >
            {/* Mobile Background */}
            <div
                className="absolute inset-0 md:hidden"
                style={{
                    backgroundImage: "url('/bg-hero.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            />
            {/* Desktop Background */}
            <div
                className="hidden md:block absolute inset-0"
                style={{
                    backgroundImage: "url('/bg-hero.jpg')",
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
                    className="relative hidden md:block bg-cover bg-center min-h-[400px] md:min-h-[600px]"
                    style={{
                        backgroundImage: "url('/backgrounds/bg5-desktop.jpeg')",
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
                            {t("auth.forgot.left-part.smallLabel")}
                        </h3>
                        <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight drop-shadow">
                            {t("auth.forgot.left-part.label")}
                        </h2>
                        <p className="mt-4 text-gray-200 max-w-sm">
                            {t("auth.forgot.left-part.description")}
                        </p>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="p-6 md:p-16 flex items-center justify-center min-h-[400px] md:min-h-[600px]">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-red-600">{t("auth.forgot.right-part.label")}</h1>
                            <p className="text-sm text-gray-500 mt-2">
                                {t("auth.forgot.right-part.description")}
                            </p>
                        </div>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <label className="block">
                                    <span className="text-xs font-medium text-gray-700">{t("auth.forgot.right-part.email")}</span>
                                    <div className="mt-2 relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                            placeholder={t("auth.forgot.right-part.email-placeholder")}
                                        />
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md"
                                >
                                    {t("auth.forgot.right-part.send-reset")}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{t("auth.forgot.success.title")}</h3>
                                <p className="text-sm text-gray-600">{t("auth.forgot.success.description")}</p>
                            </div>
                        )}

                        {/* Back to Login */}
                        <div className="mt-6 text-center">
                            <Link
                                to="/auth/login"
                                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t("auth.forgot.right-part.back-to-login")}
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
