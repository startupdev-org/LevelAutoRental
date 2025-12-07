import { Car } from "../types";

export function getCarName(car: Car) {
    return (car.make + ' ' + car.model)
}