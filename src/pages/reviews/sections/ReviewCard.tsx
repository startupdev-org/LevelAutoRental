import React from 'react';
import { motion } from 'framer-motion';
import { Review } from '../../../data/reviews';
import { Star, Heart } from 'lucide-react';

interface ReviewCardProps {
    review: Review;
    index: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{
                y: -5,
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.1)"
            }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 relative overflow-hidden group font-montserrat"
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                className="absolute top-0 left-0 h-1 "
            />

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                className="flex items-start mb-4"
            >
                {/* User Avatar/Initial */}
                <div className="flex-shrink-0 mr-4 relative">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${review.userInitialColor} border-2 border-red-100 shadow-lg`}
                    >
                        {review.userInitial}
                    </motion.div>
                </div>

                {/* User Info and Rating */}
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                            className="font-bold text-gray-800 text-lg"
                        >
                            {review.userName}
                        </motion.h3>
                        <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
                            className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                        >
                            {review.date}
                        </motion.span>
                    </div>

                    {/* Star Rating */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                        className="flex items-center mb-3"
                    >
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }, (_, starIdx) => (
                                <motion.div
                                    key={`star-${review.id}-${starIdx}`}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1 + 0.6 + starIdx * 0.1
                                    }}
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                >
                                    <Star
                                        className={`w-4 h-4 ${starIdx < review.rating ? 'text-yellow-400' : 'text-gray-300'} ${starIdx < review.rating ? 'drop-shadow-sm' : ''}`}
                                        fill={starIdx < review.rating ? 'currentColor' : 'none'}
                                    />
                                </motion.div>
                            ))}
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 + 1.1 }}
                            className="ml-2 text-sm font-medium text-red-500"
                        >
                            ({review.rating}.0)
                        </motion.span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Category */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
                className="mb-3"
            >
                <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 text-sm font-semibold rounded-full border border-red-300 shadow-sm"
                >
                    <Heart className="w-3 h-3" />
                    {review.category}
                </motion.span>
            </motion.div>

            {/* Review Content */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.7 }}
                className="mb-4"
            >
                <p className="text-gray-700 leading-relaxed text-sm">
                    {review.comment}
                </p>
            </motion.div>

            {/* Translation Link */}
            {review.isTranslated && review.originalLanguage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.8 }}
                    className="pt-3 border-t border-red-100"
                >
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-red-500"
                        >
                            🌐
                        </motion.span>
                        Tradus de LevelAutoRental •{' '}
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-red-600 hover:text-red-800 underline font-medium"
                        >
                            Vedeți originalul ({review.originalLanguage})
                        </motion.button>
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};
