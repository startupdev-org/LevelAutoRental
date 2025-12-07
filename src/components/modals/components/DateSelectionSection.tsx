import React from 'react';

interface DateSelectionSectionProps {
    pickupDate: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
    onDateChange: (field: string, value: string) => void;
}

export const DateSelectionSection: React.FC<DateSelectionSectionProps> = ({
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    onDateChange
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selectare date</h3>
            {/* TODO: Implement date selection */}
            <div className="text-sm text-gray-500">Date selection section - TODO</div>
        </div>
    );
};

export default DateSelectionSection;
