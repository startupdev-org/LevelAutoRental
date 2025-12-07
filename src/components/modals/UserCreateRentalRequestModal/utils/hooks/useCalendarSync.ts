import { useState, useEffect } from 'react';
import { BorrowRequest } from '../../../../types';

/**
 * Custom hook for synchronizing calendar months with selected dates
 * Eliminates duplicate useEffect code
 */
export const useCalendarSync = (formData: BorrowRequest) => {
    const today = new Date();
    const possibleReturnDate = new Date();
    possibleReturnDate.setDate(today.getDate() + 3);

    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>({
        pickup: today,
        return: possibleReturnDate,
    });

    // Sync calendar month with selected start date
    useEffect(() => {
        if (formData.start_date) {
            console.log('[useCalendarSync] Syncing pickup calendar to:', formData.start_date);
            setCalendarMonth((prev) => ({
                ...prev,
                pickup: new Date(formData.start_date),
            }));
        }
    }, [formData.start_date]);

    // Sync calendar month with selected end date or auto-advance for return calendar
    useEffect(() => {
        if (formData.end_date) {
            console.log('[useCalendarSync] Syncing return calendar to:', formData.end_date);
            setCalendarMonth((prev) => ({
                ...prev,
                return: new Date(formData.end_date),
            }));
        } else if (formData.start_date) {
            // Show the same month as pickup date for return calendar
            const pickup = new Date(formData.start_date);
            console.log('[useCalendarSync] Setting return calendar to pickup month');
            setCalendarMonth((prev) => ({
                ...prev,
                return: new Date(pickup),
            }));
        }
    }, [formData.end_date, formData.start_date]);

    return { calendarMonth, setCalendarMonth };
};