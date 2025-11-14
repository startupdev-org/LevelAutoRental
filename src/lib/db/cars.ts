import { supabase } from '../supabase';
import { Car } from '../../types';

/**
 * Fetch all cars from Supabase
 */
export async function fetchCars(): Promise<Car[]> {
    console.log('fetching all cars from database');
    try {
        const { data, error } = await supabase
            .from("Cars")
            .select("*");


        if (error) {
            console.error('Error fetching cars:', error);
            return [];
        }

        console.log('data: ', data)

        // data can be null, so default to empty array
        return data ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchCars:', err);
        return [];
    }
}