export const getCurrentFormattedDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('ro-RO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

export const getMonthFromDate = (date: Date): string => {
    const month = date.toLocaleDateString('ro-RO', { month: 'long' });
    return month.charAt(0).toUpperCase() + month.slice(1);
};

export const formatDateLocal = (date: string | Date, _dateType?: string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    // Format as "dd.mm.yyyy" (e.g., "10.02.2026")
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
};

export const getDateDiffInDays = (date1: string | Date, date2: string | Date): number => {
    const toMidnight = (d: string | Date) => {
        let dateObj: Date;

        if (typeof d === 'string') {
            dateObj = new Date(d); // Let JS parse ISO strings correctly
        } else {
            dateObj = new Date(d);
        }

        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    };

    const d1 = toMidnight(date1);
    const d2 = toMidnight(date2);

    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};



/**
 * Calculate rental duration in days and hours
 * @param startDateStr - start date string (YYYY-MM-DD or ISO)
 * @param startTimeStr - start time string (HH:mm)
 * @param endDateStr - end date string (YYYY-MM-DD or ISO)
 * @param endTimeStr - end time string (HH:mm)
 * @returns { days: number, hours: number, totalHours: number }
 */
export function calculateRentalDuration(
    startDateStr: Date | string,
    startTimeStr: string,
    endDateStr: Date | string,
    endTimeStr: string
) {
    const parseTime = (timeString: string) => {
        if (!timeString) return { hours: 9, minutes: 0 }; // default 09:00
        const [h, m] = timeString.split(':').map(Number);
        return { hours: h || 0, minutes: m || 0 };
    };

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const { hours: startHour, minutes: startMin } = parseTime(startTimeStr);
    const { hours: endHour, minutes: endMin } = parseTime(endTimeStr);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(endDate);
    if (endHour === 0 && endMin === 0) {
        // treat 00:00 as end of previous day
        endDateTime.setDate(endDateTime.getDate() - 1);
        endDateTime.setHours(23, 59, 59, 999);
    } else {
        endDateTime.setHours(endHour, endMin, 0, 0);
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    if (diffMs <= 0) {
        return { days: 0, hours: 0, totalHours: 0 };
    }

    const totalHours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);

    return { days, hours, totalHours };
}

