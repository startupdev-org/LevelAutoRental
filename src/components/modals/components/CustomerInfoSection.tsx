import React from 'react';

interface CustomerInfoSectionProps {
    formData: any;
    onFormDataChange: (data: any) => void;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
    formData,
    onFormDataChange
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informații client</h3>
            {/* TODO: Implement customer info form */}
            <div className="text-sm text-gray-500">Customer info section - TODO</div>
        </div>
    );
};

export default CustomerInfoSection;
