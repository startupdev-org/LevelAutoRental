export const formatTime = (input: string | Date): string => {
    if (!input) return '00:00';

    try {
        // If Date object
        if (input instanceof Date) {
            const h = input.getHours();
            const m = input.getMinutes();
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }

        let value = input.trim();

        // If string contains a date → try parsing as Date
        if (/\d{4}-\d{2}-\d{2}/.test(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const h = date.getHours();
                const m = date.getMinutes();
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
        }

        // Handle AM / PM
        const hasAMPM = /AM|PM/i.test(value);
        if (hasAMPM) {
            const isPM = /PM/i.test(value);
            value = value.replace(/AM|PM/gi, '').trim();

            const [h, m = '00'] = value.split(':');
            let hour = parseInt(h, 10);

            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;

            return `${hour.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
        }

        // Handle HH:mm or HH:mm:ss
        const [h, m = '00'] = value.split(':');
        return `${parseInt(h, 10).toString().padStart(2, '0')}:${m.padStart(2, '0')}`;

    } catch {
        return '00:00';
    }
};
