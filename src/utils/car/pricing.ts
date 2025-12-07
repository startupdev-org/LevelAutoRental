import { Car } from '../../types/index'

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