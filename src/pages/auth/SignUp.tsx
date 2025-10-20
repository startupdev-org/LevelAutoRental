import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";
import { Mail, Lock, UserRound, Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-input-2";
// @ts-ignore
import "react-phone-input-2/lib/style.css";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SignUp: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("signup", { firstName, lastName, email, phone, password });
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 md:py-12 mt-10 sm:mt-0">
            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
            >
                {/* Left - Image */}
                <div
                    className="relative hidden md:block bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/LevelAutoRental/bg-hero.jpg')",
                        minHeight: "560px",
                    }}
                >
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 h-full flex flex-col items-start justify-center p-10 text-white">
                        <h3 className="text-sm font-semibold tracking-wider text-red-300 uppercase">
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
                <div className="flex items-center justify-center p-3 sm:p-6 md:p-10 lg:p-14 xl:p-20">
                    <div className="w-[90%] max-w-[280px] sm:max-w-md md:max-w-lg mx-auto">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-red-600">
                                {t("auth.register.right-part.label")}
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                {t("auth.register.right-part.description")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                <div className="mt-2">
                                    <PhoneInput
                                        country={"md"}
                                        value={phone}
                                        onChange={(value) => setPhone(value)}
                                        inputProps={{
                                            name: "phone",
                                            required: true,
                                        }}
                                        containerClass="!w-full"
                                        inputClass="w-full rounded-lg border border-gray-200 pl-14 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
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
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md"
                            >
                                {t("auth.register.right-part.join-us")}
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
