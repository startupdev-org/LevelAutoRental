export const formatTime = (timeString: string): string => {
    if (!timeString) return '00:00';
    // Convert to 24-hour format if needed
    if (timeString.includes('AM') || timeString.includes('PM')) {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
    }
    // If already in HH:MM format, ensure it's padded
    if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
    }
    return '00:00';
};