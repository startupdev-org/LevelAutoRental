export const getCurrentFormattedDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('ro-RO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

export const getDateDiffInDays = (date1: string | Date, date2: string | Date): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
