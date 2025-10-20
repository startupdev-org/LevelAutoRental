import React from 'react';
import { motion } from 'framer-motion';
import { Review } from '../../../data/reviews';

interface ReviewCardProps {
    review: Review;
    index: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            {/* Header Section */}
            <div className="flex items-start mb-4">
                {/* User Avatar/Initial */}
                <div className="flex-shrink-0 mr-4">
                    {review.hasProfilePicture && review.profilePicture ? (
                        <img
                            src={review.profilePicture}
                            alt={review.userName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${review.userInitialColor}`}>
                            {review.userInitial}
                        </div>
                    )}
                </div>

                {/* User Info and Rating */}
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">{review.userName}</h3>
                        <span className="text-sm text-gray-500">{review.date}</span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center mb-3">
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }, (_, starIdx) => (
                                <svg
                                    key={`star-${review.id}-${starIdx}`}
                                    className={`w-4 h-4 ${starIdx < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category */}
            <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                    {review.category}
                </span>
            </div>

            {/* Review Content */}
            <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                </p>
            </div>

            {/* Translation Link */}
            {review.isTranslated && review.originalLanguage && (
                <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Tradus de LevelAutoRental •{' '}
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Vedeți originalul ({review.originalLanguage})
                        </button>
                    </p>
                </div>
            )}
        </motion.div>
    );
};
