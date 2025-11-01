export const getCurrentFormattedDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('ro-RO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};