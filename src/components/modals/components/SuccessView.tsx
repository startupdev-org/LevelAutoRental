import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessViewProps {
    onClose: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ onClose }) => {
    return (
        <div className="text-center py-12 px-6">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cererea a fost trimisă cu succes!
            </h3>
            <p className="text-gray-600 mb-6">
                Veți fi contactat în curând pentru confirmarea detaliilor.
            </p>
            <button
                onClick={onClose}
                className="px-6 py-3 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-xl transition-colors"
            >
                Închide
            </button>
        </div>
    );
};

export default SuccessView;
