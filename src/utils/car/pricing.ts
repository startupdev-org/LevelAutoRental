import { OptionsState } from '../../constants/rentalOptions';
import { BorrowRequest, BorrowRequestDTO, Car } from '../../types/index'
import { getDateDiffInDays, calculateRentalDuration } from '../date';

export interface PriceSummaryResult {
    pricePerDay: number;
    rentalDays: number;
    rentalHours: number;
    totalHours: number;
    basePrice: number;
    additionalCosts: number;
    totalPrice: number;
    baseCarPrice: number;
}

export function getCarPrice(rentalDays: number, car: Car): string {
    let basePricePerDay = 0;
    if (rentalDays >= 2 && rentalDays <= 4) {
        basePricePerDay = car.price_2_4_days || 0;
    } else if (rentalDays >= 5 && rentalDays <= 15) {
        basePricePerDay = car.price_5_15_days || 0;
    } else if (rentalDays >= 16 && rentalDays <= 30) {
        basePricePerDay = car.price_16_30_days || 0;
    } else if (rentalDays > 30) {
        basePricePerDay = car.price_over_30_days || 0;
    }
    return basePricePerDay.toString();
}

export const calculateAmount = (totalDays: number, pricePerDay: number, startDate: Date | string, endDate: Date | string, carId: string, options: OptionsState) => {
    if (!startDate || !endDate || !carId) return 0;

    let basePrice = pricePerDay * totalDays;

    // Calculate additional costs from options
    let additionalCosts = 0;
    const baseCarPrice = pricePerDay;

    // Percentage-based options (calculated on totalDays)
    if (options.unlimitedKm) {
        additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
    }
    if (options.speedLimitIncrease) {
        additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
    }
    if (options.tireInsurance) {
        additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
    }

    // Fixed daily costs
    if (options.personalDriver) {
        additionalCosts += 800 * totalDays;
    }
    if (options.priorityService) {
        additionalCosts += 1000 * totalDays;
    }
    if (options.childSeat) {
        additionalCosts += 100 * totalDays;
    }
    if (options.simCard) {
        additionalCosts += 100 * totalDays;
    }
    if (options.roadsideAssistance) {
        additionalCosts += 500 * totalDays;
    }

    const total = basePrice + additionalCosts;

    // optional: round to 2 decimals for storage
    return Math.round(total * 100) / 100;
};

export function calculatePriceSummary(
    selectedCar: Car,
    formData: BorrowRequest | BorrowRequestDTO,
    options: OptionsState
): PriceSummaryResult | null {

    if (!selectedCar || !formData.start_date || !formData.end_date) return null;

    // Calculate both days and hours
    const duration = calculateRentalDuration(
        formData.start_date,
        formData.start_time || '09:00',
        formData.end_date,
        formData.end_time || '09:00'
    );

    const { days: rentalDays, hours: rentalHours, totalHours } = duration;
    if (isNaN(rentalDays) || rentalDays < 0 || isNaN(rentalHours) || rentalHours < 0) return null;

    const pricePerDayStr = getCarPrice(rentalDays, selectedCar);
    let pricePerDay = parseFloat(pricePerDayStr);
    if (isNaN(pricePerDay)) return null;

    // Apply car discount if exists (same as OrderDetailsModal)
    // Check both discount_percentage (mapped) and discount (raw DB field)
    const carDiscount = selectedCar.discount_percentage || (selectedCar as any).discount || 0;
    if (carDiscount > 0) {
        pricePerDay = pricePerDay * (1 - carDiscount / 100);
    }

    // Calculate total days including hours (for percentage-based calculations)
    const totalDays = totalHours / 24;

    // Calculate base price for days
    let basePrice = pricePerDay * rentalDays;

    // Add hours portion (hours are charged at full price, no discount)
    if (rentalHours > 0) {
        const hoursPrice = (rentalHours / 24) * pricePerDay;
        basePrice += hoursPrice;
    }

    let additionalCosts = 0;
    const baseCarPrice = pricePerDay;

    // Percentage-based options (calculated as percentage of base car price * totalDays)
    // These should be calculated on the total rental period (days + hours)
    if (options.unlimitedKm) additionalCosts += baseCarPrice * totalDays * 0.5;
    if (options.speedLimitIncrease) additionalCosts += baseCarPrice * totalDays * 0.2;
    if (options.tireInsurance) additionalCosts += baseCarPrice * totalDays * 0.2;

    // Fixed daily costs (calculated per total rental period including hours)
    if (options.personalDriver) additionalCosts += 800 * totalDays;
    if (options.priorityService) additionalCosts += 1000 * totalDays;
    if (options.childSeat) additionalCosts += 100 * totalDays;
    if (options.simCard) additionalCosts += 100 * totalDays;
    if (options.roadsideAssistance) additionalCosts += 500 * totalDays;

    const totalPrice = basePrice + additionalCosts;

    return {
        pricePerDay,
        rentalDays,
        rentalHours,
        totalHours,
        basePrice,
        additionalCosts,
        totalPrice,
        baseCarPrice,
    };
}