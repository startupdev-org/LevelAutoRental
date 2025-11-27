import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 w-full">
            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            </div>
            <p className="mt-2 text-sm text-gray-400">{message || 'Loading...'}</p>
        </div>
    );
};
