import React from 'react';

interface RentalOptionsSectionProps {
    selectedOptions: any;
    onOptionsChange: (options: any) => void;
}

export const RentalOptionsSection: React.FC<RentalOptionsSectionProps> = ({
    selectedOptions,
    onOptionsChange
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Opțiuni închiriere</h3>
            {/* TODO: Implement rental options */}
            <div className="text-sm text-gray-500">Rental options section - TODO</div>
        </div>
    );
};

export default RentalOptionsSection;
