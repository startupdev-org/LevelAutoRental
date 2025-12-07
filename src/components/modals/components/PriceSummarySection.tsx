import React from 'react';

interface PriceSummarySectionProps {
    totalPrice: number;
    currency: string;
    breakdown: any;
}

export const PriceSummarySection: React.FC<PriceSummarySectionProps> = ({
    totalPrice,
    currency,
    breakdown
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sumar preț</h3>
            {/* TODO: Implement price summary */}
            <div className="text-sm text-gray-500">Price summary section - TODO</div>
            <div className="text-right font-bold text-lg">
                Total: {totalPrice} {currency}
            </div>
        </div>
    );
};

export default PriceSummarySection;
