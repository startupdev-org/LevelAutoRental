// Combine date and time into full timestamps for start_date and end_date
// Store as local time, not UTC, to avoid timezone conversion issues
export const formatTimestamp = (
    dateStr?: string | null,
    timeStr?: string | null
): Date => {
    if (!dateStr && !timeStr) {
        throw new Error("Both dateStr and timeStr are missing.");
    }

    // If full ISO timestamp or valid date already
    if (dateStr && (dateStr.includes("T") || !isNaN(Date.parse(dateStr)))) {
        const fullDate = new Date(dateStr);
        if (isNaN(fullDate.getTime())) {
            throw new Error(`Invalid dateStr: ${dateStr}`);
        }
        return fullDate;
    }

    if (!dateStr) {
        throw new Error("dateStr is required when timeStr is provided.");
    }

    // Default time if missing
    let time = timeStr?.trim() || "00:00:00";

    // Normalize HH:mm => HH:mm:ss
    if (/^\d{1,2}:\d{2}$/.test(time)) {
        time = `${time}:00`;
    }

    // Normalize HH => HH:00:00
    if (/^\d{1,2}$/.test(time)) {
        time = `${time}:00:00`;
    }

    // Final check
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
        throw new Error(`Invalid time format: ${time}`);
    }

    // Build local ISO date
    const combined = `${dateStr}T${time}`;

    const result = new Date(combined);

    if (isNaN(result.getTime())) {
        throw new Error(`Invalid combined datetime: ${combined}`);
    }

    return result;
};


export const formatTimeHHMM = (date?: Date | string): string => {
    if (!date) return ''; // fallback if undefined or empty

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');

    return `${hh}:${mm}`; // returns "HH:mm" only, no seconds
};
