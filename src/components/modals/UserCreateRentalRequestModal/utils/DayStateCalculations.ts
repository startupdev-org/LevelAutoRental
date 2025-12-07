import { DayState } from '../../../utils/calendar/calendar';
import { formatDateLocal } from '../../../utils/date';
import { isDateInActualApprovedRequest, getEarliestFutureRentalStart } from '../../../lib/db/requests/requests';
import { MINIMUM_RENTAL_DAYS } from './constants';
import { CarType } from '../../../types';

/**
 * Check if a date is in the past
 */
export const checkIsPastDate = (dayString: string): boolean => {
    const dayDate = new Date(dayString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    console.log(`[checkIsPastDate] Checking ${dayString} against today ${formatDateLocal(today)}: ${dayDate < today}`);
    return dayDate < today;
};

/**
 * Check if a date is already booked by approved rental requests
 */
export const checkIsAlreadyBooked = async (
    dayString: string,
    selectedCarId: string
): Promise<boolean> => {
    try {
        const isInApprovedRequest = isDateInActualApprovedRequest(dayString, selectedCarId);
        console.log(`[checkIsAlreadyBooked] Date ${dayString} in approved request: ${isInApprovedRequest}`);
        return isInApprovedRequest;
    } catch (error) {
        console.error(`[checkIsAlreadyBooked] Error checking date ${dayString}:`, error);
        return false;
    }
};

/**
 * Check if a date is before the minimum rental period (2 days from pickup)
 */
export const checkIsLessThanMinDays = (dayString: string, pickupDate: string | null): boolean => {
    if (!pickupDate) {
        console.log('[checkIsLessThanMinDays] No pickup date set');
        return false;
    }

    const dayDate = new Date(dayString);
    const pickupDateObj = new Date(pickupDate);
    const diffTime = dayDate.getTime() - pickupDateObj.getTime();
    const diffDays = Math.floor(diffTime / 86400000);
    const isLessThanMin = diffDays < MINIMUM_RENTAL_DAYS;

    console.log(`[checkIsLessThanMinDays] Days between pickup and return: ${diffDays}, Less than ${MINIMUM_RENTAL_DAYS}: ${isLessThanMin}`);
    return isLessThanMin;
};

/**
 * Check if a date is blocked by a future rental booking
 */
export const checkIsBlockedByFuture = (
    dayString: string,
    pickupDate: string | null
): boolean => {
    const earliestStart = getEarliestFutureRentalStart();
    if (!earliestStart || !pickupDate) {
        console.log('[checkIsBlockedByFuture] No future rental or pickup date');
        return false;
    }

    const dayDate = new Date(dayString);
    const pickupDateObj = new Date(pickupDate);
    const earliestStartDate = new Date(earliestStart);

    dayDate.setHours(0, 0, 0, 0);
    pickupDateObj.setHours(0, 0, 0, 0);
    earliestStartDate.setHours(0, 0, 0, 0);

    // If pickup is on or after the future rental start, don't block
    if (pickupDateObj >= earliestStartDate) {
        console.log(`[checkIsBlockedByFuture] Pickup date (${pickupDate}) is after or on future rental start`);
        return false;
    }

    const isBlocked = dayDate >= earliestStartDate;
    console.log(`[checkIsBlockedByFuture] Return date ${dayString} blocked: ${isBlocked}`);
    return isBlocked;
};

/**
 * Check if a date is before the next available date
 */
export const checkIsBeforeAvailable = (
    dayString: string,
    effectiveNextAvailableDate: Date | null
): boolean => {
    if (!effectiveNextAvailableDate) {
        console.log('[checkIsBeforeAvailable] No next available date');
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextAvailDate = new Date(effectiveNextAvailableDate);
    nextAvailDate.setHours(0, 0, 0, 0);
    const dayDate = new Date(dayString);
    dayDate.setHours(0, 0, 0, 0);

    const isBlocked = nextAvailDate <= today && dayDate < nextAvailDate;
    console.log(`[checkIsBeforeAvailable] Date ${dayString} before available: ${isBlocked}`);
    return isBlocked;
};

/**
 * Check if a date is before the pickup date
 */
export const checkIsBeforePickup = (dayString: string, pickupDate: string | null): boolean => {
    if (!pickupDate) {
        console.log('[checkIsBeforePickup] No pickup date set');
        return false;
    }

    const dayDate = new Date(dayString);
    const pickupDateObj = new Date(pickupDate);
    dayDate.setHours(0, 0, 0, 0);
    pickupDateObj.setHours(0, 0, 0, 0);

    const isBlocked = dayDate <= pickupDateObj;
    console.log(`[checkIsBeforePickup] Date ${dayString} before or on pickup ${pickupDate}: ${isBlocked}`);
    return isBlocked;
};

/**
 * Get reason message for blocked dates
 */
export const getBlockReason = (
    isPast: boolean,
    isAlreadyBooked: boolean,
    isBlockedByFuture: boolean,
    isLessThanMinDays: boolean,
    isBeforePickup: boolean
): string | undefined => {
    if (isPast) return "Data este în trecut";
    if (isAlreadyBooked) return "Data este deja rezervată";
    if (isBlockedByFuture) {
        const earliestStart = getEarliestFutureRentalStart();
        if (earliestStart) {
            const formatted = new Date(earliestStart).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            return `Mașina este rezervată începând cu ${formatted}`;
        }
        return "Mașina este rezervată";
    }
    if (isLessThanMinDays) return `Perioada minimă de închiriere este de ${MINIMUM_RENTAL_DAYS} zile`;
    if (isBeforePickup) return "Nu puteți selecta o dată înainte de ridicare";
    return undefined;
};

/**
 * Main function to get the complete day state
 */
export const getDayState = (
    dayString: string,
    selectedCar: CarType | null,
    formData: { start_date: string; end_date: string },
    effectiveNextAvailableDate: Date | null
): DayState => {
    console.log(`[getDayState] Calculating state for ${dayString}`);

    if (selectedCar === null) {
        throw Error('No car selected!');
    }

    const dayDate = new Date(dayString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);

    const pickupDate = formData.start_date ? new Date(formData.start_date) : null;
    const returnDate = formData.end_date ? new Date(formData.end_date) : null;

    if (pickupDate) pickupDate.setHours(0, 0, 0, 0);
    if (returnDate) returnDate.setHours(0, 0, 0, 0);

    // Check all blocking conditions
    const isPast = checkIsPastDate(dayString);
    const isAlreadyBooked = checkIsAlreadyBooked(dayString, selectedCar.id).then(() => false).catch(() => false);
    const isLessThanMinDays = checkIsLessThanMinDays(dayString, formData.start_date);
    const isBlockedByFuture = checkIsBlockedByFuture(dayString, formData.start_date);
    const isBeforeAvailable = checkIsBeforeAvailable(dayString, effectiveNextAvailableDate);
    const isBeforePickup = checkIsBeforePickup(dayString, formData.start_date);

    // Check if selected or in range
    const isSelected = dayString === formData.end_date;
    const isPickupDate = dayString === formData.start_date;
    const isInRange =
        pickupDate &&
        returnDate &&
        dayDate > pickupDate &&
        dayDate < returnDate;

    // Determine if blocked
    const isBlocked = isPast || isBeforeAvailable || isBlockedByFuture || isBeforePickup;

    // Get reason
    const reason = getBlockReason(isPast, false, isBlockedByFuture, isLessThanMinDays, isBeforePickup);

    console.log(`[getDayState] Final state for ${dayString}:`, {
        isBlocked,
        isLessThanMinDays,
        reason,
    });

    return {
        isBlocked,
        isAlreadyBooked: false,
        isInRange: Boolean(isInRange),
        isSelected,
        isPickupDate,
        isLessThanMinDays,
        reason,
    };
};