export const formatTime = (timeString: string): string => {
    if (!timeString) return '00:00';
    try {
        let cleanTime = timeString.trim();
        const hasAMPM = /AM|PM/i.test(cleanTime);
        if (hasAMPM) {
            const isPM = /PM/i.test(cleanTime);
            cleanTime = cleanTime.replace(/AM|PM/gi, '').trim();
            const [hours, minutes] = cleanTime.split(':');
            let hour = parseInt(hours, 10);
            if (isPM && hour !== 12) hour += 12;
            else if (!isPM && hour === 12) hour = 0;
            return `${hour.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
        }
        const [hours, minutes] = cleanTime.split(':');
        return `${parseInt(hours, 10).toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    } catch {
        return '00:00';
    }
};
