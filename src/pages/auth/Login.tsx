import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animations";

export const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-50 via-white to-theme-100">
            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
            >
                <h2 className="text-3xl font-bold text-theme-500 mb-6 text-center">Login</h2>
                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-theme-500 focus:ring-theme-500"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-theme-500 focus:ring-theme-500"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-theme-500 text-white rounded-md font-semibold hover:bg-theme-600 transition"
                    >
                        Login
                    </button>
                </form>
            </motion.div>
        </section>
    );
};