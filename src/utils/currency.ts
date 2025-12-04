export function formatAmount(amount: number | string | null | undefined) {
    if (!amount) return '0';

    const num = typeof amount === 'string'
        ? parseFloat(amount)
        : amount;

    return num.toLocaleString('ro-RO');
}
