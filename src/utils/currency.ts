export function formatAmount(amount: number | string | null | undefined) {
    if (!amount) return '0 MDL';

    const num = typeof amount === 'string'
        ? parseFloat(amount)
        : amount;

    // Round down to whole number and use standard formatting
    const floored = Math.floor(num);
    return `${floored.toLocaleString()} MDL`;
}
