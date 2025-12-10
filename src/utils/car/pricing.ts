import { OptionsState } from '../../constants/rentalOptions';
import { BorrowRequest, BorrowRequestDTO, Car } from '../../types/index'
import { getDateDiffInDays } from '../date';

export interface PriceSummaryResult {
    pricePerDay: number;
    rentalDays: number;
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

    console.log('the total is: ', total)

    // optional: round to 2 decimals for storage
    return Math.round(total * 100) / 100;
};

export function calculatePriceSummary(
    selectedCar: Car,
    formData: BorrowRequest | BorrowRequestDTO,
    options: OptionsState
): PriceSummaryResult | null {
    console.log('calculating the summary price')

    if (!selectedCar || !formData.start_date || !formData.end_date) return null;

    const rentalDays = getDateDiffInDays(formData.start_date, formData.end_date);
    if (isNaN(rentalDays) || rentalDays <= 0) return null;

    const pricePerDayStr = getCarPrice(rentalDays, selectedCar);
    const pricePerDay = parseFloat(pricePerDayStr);
    if (isNaN(pricePerDay)) return null;

    let basePrice = pricePerDay * rentalDays;


    let additionalCosts = 0;
    const baseCarPrice = pricePerDay;

    if (options.unlimitedKm) additionalCosts += baseCarPrice * rentalDays * 0.5;
    if (options.speedLimitIncrease) additionalCosts += baseCarPrice * rentalDays * 0.2;
    if (options.tireInsurance) additionalCosts += baseCarPrice * rentalDays * 0.2;
    if (options.personalDriver) additionalCosts += 800 * rentalDays;
    if (options.priorityService) additionalCosts += 1000 * rentalDays;
    if (options.childSeat) additionalCosts += 100 * rentalDays;
    if (options.simCard) additionalCosts += 100 * rentalDays;
    if (options.roadsideAssistance) additionalCosts += 500 * rentalDays;

    const totalPrice = basePrice + additionalCosts;

    console.log('total price from price summary is: ', totalPrice)

    return {
        pricePerDay,
        rentalDays,
        basePrice,
        additionalCosts,
        totalPrice,
        baseCarPrice,
    };
}