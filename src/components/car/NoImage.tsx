import { useTranslation } from 'react-i18next';
import { Image } from 'lucide-react';

export const NoImagePlaceholder = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full h-56 bg-gray-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                <Image className="w-8 h-8 text-gray-300" />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t('car.noImage')}
            </span>
        </div>
    );
};
