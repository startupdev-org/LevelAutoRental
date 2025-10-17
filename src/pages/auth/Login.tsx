import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";
import { Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: handle login
        console.log("login", { email, password });
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gray-50">
            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
            >
                {/* Left - Image / promo (image on left as requested) */}
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
                            Welcome Back
                        </h3>
                        <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight drop-shadow">
                            Explore Cars, Rent Fast
                        </h2>
                        <p className="mt-4 text-gray-200 max-w-sm">
                            Find and reserve the perfect car for your trip. Fast pickup, clear
                            terms and 24/7 support.
                        </p>

                        <div className="mt-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="p-8 md:p-12 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-red-600">Login</h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Sign in to your account to manage bookings and rentals.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">Email</span>
                                <div className="mt-2 relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-xs font-medium text-gray-700">Password</span>
                                <div className="mt-2 relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </label>

                            <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-red-600" />
                                    Remember me
                                </label>
                                <Link to="/auth/forgot" className="text-sm text-red-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md"
                            >
                                Login
                            </button>
                        </form>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className="text-xs text-gray-400 uppercase">or</div>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/auth/signup"
                                className="inline-block px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                            >
                                Create an account
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};