import React from 'react';
import { motion } from 'framer-motion';
import { Review } from '../../../data/reviews';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReviewCardProps {
    review: Review;
    index: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {
    const { t } = useTranslation();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-300"
        >
            {/* User Header */}
            <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0 ${review.userInitialColor}`}>
                    {review.userInitial}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                        {review.userName}
                    </h3>
                    <div className="text-sm text-gray-500">
                        {review.date}
                    </div>
                </div>
            </div>

            {/* Stars and Rating */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, starIdx) => (
                        <Star
                            key={`star-${review.id}-${starIdx}`}
                            className={`w-5 h-5 ${starIdx < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                    ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                    {review.rating}.0
                </span>
                {review.category && !['Spălare', 'Detailing auto', 'Vânzare'].includes(review.category) && (
                    <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                        {t(`pages.reviews.categories.${review.category}`, { defaultValue: review.category })}
                    </span>
                )}
            </div>

            {/* Review Text */}
            {review.comment && review.comment !== 'Evaluare fără recenzie' && (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-gray-700 text-[15px] leading-relaxed">
                        {review.comment}
                    </p>
                </div>
            )}
        </motion.div>
    );
};
