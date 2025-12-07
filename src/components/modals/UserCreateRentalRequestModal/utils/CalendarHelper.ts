/**
 * Generate calendar days for a given month (42 days grid)
 */
export const generateCalendarDays = (date: Date): (string | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (string | null)[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
        if (currentDate.getMonth() === month) {
            days.push(currentDate.toISOString().split('T')[0]);
        } else {
            days.push(null);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`[generateCalendarDays] Generated ${days.filter(Boolean).length} days for ${date.getMonth() + 1}/${date.getFullYear()}`);
    return days;
};

/**
 * Generate hours for time picker
 */
export const generateHours = (minHour?: number): string[] => {
    const hours: string[] = [];
    const startHour = minHour !== undefined ? minHour : 0;
    for (let h = startHour; h < 24; h++) {
        hours.push(`${String(h).padStart(2, '0')}:00`);
    }

    console.log(`[generateHours] Generated ${hours.length} hours starting from ${startHour}`);
    return hours;
};