import { Car, FavoriteCar, User } from '../../../types';
import { Rental } from '../../orders';
import { supabase } from '../../supabase';
import { fetchCarWithImagesById } from '../cars/cars';
import { getLoggedUser, getProfile } from '../user/profile';


export async function getUserRentals(): Promise<Rental[]> {

    const user = await getLoggedUser();

    const { data } = await supabase
        .from('Rentals')
        .select()
        .eq('user_id', user?.id)

    console.log('user rentals: ', data);

    return data || [];
}

export async function fetchFavoriteCar(): Promise<FavoriteCar> {

    const user = await getLoggedUser();

    // count rentals per car
    const { data, error } = await supabase.rpc('get_user_favorite_car', {
        p_user_id: user?.id
    })

    if (error) {
        console.error('Error fetching favorite car:', error);
        return { car: null, lastRental: null, borrowCount: null };
    }

    // console.log('data from favorite car: ', data)

    // if (!data || data.length === 0) return null;

    const favoriteCarId = data[0].car_id;
    const lastRental = data[0].last_rental;
    const borrowCount = data[0].rental_count;
    // console.log('car id: ', favoriteCarId)
    // console.log('lastRental: ', lastRental)
    // console.log('borrowcount: ', borrowCount)

    const car = await fetchCarWithImagesById(favoriteCarId);

    return {
        car,
        lastRental,
        borrowCount
    };
}

export async function fetchRecentRentals(): Promise<Rental[]> {

    const user = await getLoggedUser();

    // count rentals per car
    const { data, error } = await supabase
        .from('Rentals')
        .select()
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent rentals:', error);
        return [];
    }

    console.log('sql!!! -> recent rentals: ', data)

    // Convert rentals using DTO mapping
    const rentals: Rental[] = await Promise.all(
        data.map(async (rentalRow: Rental) => {
            return toRentalDTO(rentalRow, rentalRow.car_id);
        })
    );

    console.log('rentals after structuring to dtos: ', rentals);

    return rentals;
}

async function toRentalDTO(rental: Rental, carId: string): Promise<Rental> {

    const carWithImage = await fetchCarWithImagesById(carId);

    rental.car = carWithImage;

    return rental;
}
