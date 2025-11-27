import React from "react";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    buttonText?: string;
    onButtonClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    subtitle,
    buttonText,
    onButtonClick,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            {icon && (
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}

            <p className="text-gray-400 text-lg font-medium mb-1">{title}</p>
            {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}

            {buttonText && onButtonClick && (
                <button
                    onClick={onButtonClick}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2 mt-4"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};
