import { TFunction } from "i18next";
import { formatDateLocal } from "../date";

export interface DayState {
    isBlocked: boolean
    isInRange: boolean
    isAlreadyBooked: boolean
    isSelected: boolean
    isPickupDate: boolean
    isLessThanMinDays: boolean
    reason?: string
}

interface ReturnDateStatusResult {
    isBlocked: boolean;
    isInRange: boolean;
    isAlreadyBooked: boolean;
    isSelected: boolean;
    reason?: string;
}

interface ReturnDateStatusArgs {
    dayString: string;
    pickupDate?: string;
    selectedReturnDate?: string;
    effectiveNextAvailableDate?: string | null;
    earliestFutureRentalStart?: string | null;

    isDateInActualApprovedRequest: (date: string) => boolean;
    isDateAlreadyBooked: (date: string) => boolean;

    t: TFunction;
}

export function getReturnDateStatus({
    dayString,
    pickupDate,
    selectedReturnDate,
    effectiveNextAvailableDate,
    earliestFutureRentalStart,
    isDateInActualApprovedRequest,
    isDateAlreadyBooked,
    t
}: ReturnDateStatusArgs): ReturnDateStatusResult {

    const day = formatDateLocal(dayString, t('config.date'));
    const today = formatDateLocal(new Date(), t('config.date'));

    // --- BASE STATES ---
    const isSelected = day === selectedReturnDate;
    const isPickupDate = pickupDate && day === pickupDate;

    const isInRange =
        Boolean(pickupDate && selectedReturnDate) &&
        day > pickupDate! &&
        day < selectedReturnDate!;

    const isAlreadyBooked = isDateAlreadyBooked(day) || isDateInActualApprovedRequest(day);

    // --- RULES ---

    // Rule A: Past date
    if (day < today) {
        return {
            isBlocked: true,
            isInRange,
            isAlreadyBooked,
            isSelected,
            reason: 'Această dată este în trecut'
        };
    }

    // Rule B: Before or same as pickup
    if (pickupDate && day <= pickupDate) {
        return {
            isBlocked: true,
            isInRange,
            isAlreadyBooked,
            isSelected,
            reason: 'Data de return trebuie să fie după data de preluare'
        };
    }

    // Rule D: Minimum 2 days
    if (pickupDate) {
        const diff =
            (new Date(day).getTime() - new Date(pickupDate).getTime()) /
            (1000 * 60 * 60 * 24);

        if (diff < 2) {
            return {
                isBlocked: true,
                isInRange,
                isAlreadyBooked,
                isSelected,
                reason: 'Perioada minimă de închiriere este de 2 zile'
            };
        }
    }

    // Rule C & F: Approved / already booked
    if (isAlreadyBooked) {
        return {
            isBlocked: true,
            isInRange,
            isAlreadyBooked,
            isSelected,
            reason: 'Această dată este deja rezervată'
        };
    }

    // Rule: blocked by future rental
    if (pickupDate && earliestFutureRentalStart) {
        const futureStart = formatDateLocal(earliestFutureRentalStart, t('config.date'));

        if (pickupDate < futureStart && day >= futureStart) {
            const formatted = new Date(futureStart).toLocaleDateString(t('config.date'), {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            return {
                isBlocked: true,
                isInRange,
                isAlreadyBooked,
                isSelected,
                reason: `Mașina este rezervată începând cu ${formatted}`
            };
        }
    }

    // Rule: Before next available only if current booking exists
    if (effectiveNextAvailableDate) {
        const nextAvail = formatDateLocal(effectiveNextAvailableDate, t('config.date'));

        if (nextAvail <= today && day < nextAvail) {
            return {
                isBlocked: true,
                isInRange,
                isAlreadyBooked,
                isSelected,
                reason: 'Mașina nu este disponibilă în această perioadă'
            };
        }
    }

    // ✅ ALLOWED
    return {
        isBlocked: false,
        isInRange,
        isAlreadyBooked,
        isSelected
    };
}
