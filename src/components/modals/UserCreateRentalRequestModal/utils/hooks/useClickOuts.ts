import { useEffect } from 'react';
import React from 'react';

interface ClickOutsideRefs {
    pickupCalendarRef: React.RefObject<HTMLDivElement>;
    returnCalendarRef: React.RefObject<HTMLDivElement>;
    pickupTimeRef: React.RefObject<HTMLDivElement>;
    returnTimeRef: React.RefObject<HTMLDivElement>;
}

interface ClickOutsideState {
    showPickupCalendar: boolean;
    showReturnCalendar: boolean;
    showPickupTime: boolean;
    showReturnTime: boolean;
    isClosingWithDelay: boolean;
}

/**
 * Custom hook to handle click outside closing for dropdowns and calendars
 */
export const useClickOutside = (
    refs: ClickOutsideRefs,
    state: ClickOutsideState,
    setters: {
        setShowPickupCalendar: (v: boolean) => void;
        setShowReturnCalendar: (v: boolean) => void;
        setShowPickupTime: (v: boolean) => void;
        setShowReturnTime: (v: boolean) => void;
        setShowCountryCodeDropdown: (v: boolean) => void;
    }
) => {
    useEffect(() => {
        console.log('[useClickOutside] Setting up click outside handlers');

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (state.isClosingWithDelay) return;

            const target = event.target as HTMLElement;

            // Close country code dropdown
            if (!target.closest('.country-code-dropdown-container')) {
                setters.setShowCountryCodeDropdown(false);
            }

            // Close pickup calendar
            if (
                state.showPickupCalendar &&
                refs.pickupCalendarRef.current &&
                !refs.pickupCalendarRef.current.contains(target as Node)
            ) {
                console.log('[useClickOutside] Closing pickup calendar');
                setters.setShowPickupCalendar(false);
            }

            // Close return calendar
            if (
                state.showReturnCalendar &&
                refs.returnCalendarRef.current &&
                !refs.returnCalendarRef.current.contains(target as Node)
            ) {
                console.log('[useClickOutside] Closing return calendar');
                setters.setShowReturnCalendar(false);
            }

            // Close pickup time
            if (
                state.showPickupTime &&
                refs.pickupTimeRef.current &&
                !refs.pickupTimeRef.current.contains(target as Node)
            ) {
                console.log('[useClickOutside] Closing pickup time');
                setters.setShowPickupTime(false);
            }

            // Close return time
            if (
                state.showReturnTime &&
                refs.returnTimeRef.current &&
                !refs.returnTimeRef.current.contains(target as Node)
            ) {
                console.log('[useClickOutside] Closing return time');
                setters.setShowReturnTime(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [state, setters, refs]);
};