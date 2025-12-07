import React from 'react';

interface CarSelectionSectionProps {
    selectedCar: any;
    onCarSelect: (car: any) => void;
}

export const CarSelectionSection: React.FC<CarSelectionSectionProps> = ({
    selectedCar,
    onCarSelect
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selectare mașină</h3>
            {/* TODO: Implement car selection */}
            <div className="text-sm text-gray-500">Car selection section - TODO</div>
        </div>
    );
};

export default CarSelectionSection;
