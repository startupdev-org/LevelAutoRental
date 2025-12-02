import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
    timeoutMessage?: string;
    timeoutMs?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading...",
    timeoutMessage = "An error occurred. The data is not currently available.",
    timeoutMs = 5000,
}) => {

    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true);
        }, timeoutMs);

        return () => clearTimeout(timer);
    }, [timeoutMs]);

    if (timedOut) {
        return (
            <div className="flex flex-col items-center justify-center py-12 w-full text-center">
                <p className="text-red-400 font-semibold mb-1">{timeoutMessage}</p>
                <p className="text-gray-500 text-sm">
                    Please try again in a moment.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 w-full">
            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            </div>
            <p className="mt-2 text-sm text-gray-400">{message}</p>
        </div>
    );
};
