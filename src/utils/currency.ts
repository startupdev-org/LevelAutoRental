export function formatAmount(amount: number | string | null | undefined) {
    if (!amount) return '0 MDL';

    const num = typeof amount === 'string'
        ? parseFloat(amount)
        : amount;

    // Round down to whole number and use standard formatting
    const floored = Math.floor(num);
    return `${floored.toLocaleString()} MDL`;
}


// utils/currency.ts
export const formatPrice = (
    amount: number,
    currency: string,
    locale: string,
    options?: Intl.NumberFormatOptions
): string => {
    if (isNaN(amount)) return '';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...options,
    }).format(amount);
};

export type Currency = 'MDL' | 'EUR' | 'USD';

export const getSelectedCurrency = (): Currency => {
    if (typeof window === 'undefined') {
        return 'MDL';
    }

    const value = localStorage.getItem('selectedCurrency');

    if (value === 'MDL' || value === 'EUR' || value === 'USD') {
        return value;
    }

    return 'MDL';
};


export const handleSetSelectedCurrency = (code: string) => {
    localStorage.setItem("selectedLanguage", code);
}