export const formatAmount = (value: number) => {
    return new Intl.NumberFormat('ro-RO').format(value);
};
