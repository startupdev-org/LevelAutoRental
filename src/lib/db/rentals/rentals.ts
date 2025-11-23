import { Car, FavoriteCar, User } from '../../../types';
import { Rental } from '../../orders';
import { supabase } from '../../supabase';
import { fetchCarIdsByQuery, fetchCarWithImagesById } from '../cars/cars';
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

const ACTIVE_RENTAL_STATUS = 'ACTIVE'

export async function fetchActiveRentals(): Promise<Rental[]> {

    const user = await getLoggedUser();

    // count rentals per car
    const { data, error } = await supabase
        .from('Rentals')
        .select()
        .eq('user_id', user?.id)
        .eq('rental_status', ACTIVE_RENTAL_STATUS)

    if (error) {
        console.error('Error fetching active rentals:', error);
        return [];
    }

    console.log('sql!!! -> active rentals: ', data)

    // Convert rentals using DTO mapping
    const rentals: Rental[] = await Promise.all(
        data.map(async (rentalRow: Rental) => {
            return toRentalDTO(rentalRow, rentalRow.car_id);
        })
    );

    console.log('active rentals after structuring to dtos: ', rentals);

    return rentals;
}

export async function fetchRentalsHistory(
    page = 1,
    pageSize = 10,
    sortBy: 'start_date' | 'total_amount' | null = 'start_date',
    sortOrder: 'asc' | 'desc' = 'desc',
    searchQuery: string = ''
): Promise<{ rentals: Rental[]; total: number }> {
    const user = await getLoggedUser();
    if (!user) return { rentals: [], total: 0 };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("Rentals")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .range(from, to);

    // Handle sorting
    if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Handle search query
    if (searchQuery) {
        // Get the IDs of cars that match the search
        const carIds = await fetchCarIdsByQuery(searchQuery);
        if (carIds.length > 0) {
            query = query.in('car_id', carIds);
        } else {
            // No matching cars, return empty result early
            return { rentals: [], total: 0 };
        }
    }

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching rentals history:", error);
        return { rentals: [], total: 0 };
    }

    const rentals: Rental[] = await Promise.all(
        (data || []).map(async (row: any) => toRentalDTO(row, row.car_id))
    );

    return { rentals, total: count ?? 0 };
}


export async function fetchRentalsCalendarPage(
    carId?: string,
    month?: Date,
    status?: string
): Promise<Rental[]> {
    const user = await getLoggedUser();
    if (!user) return [];

    let query = supabase
        .from("Rentals")
        .select("*")
        .eq("user_id", user.id);

    // Filter by month (expects "YYYY-MM")
    if (month) {
        const year = month.getFullYear();
        const m = month.getMonth(); // 0-based

        const firstDay = new Date(year, m, 1).toISOString();
        const nextMonthFirst = new Date(year, m + 1, 1).toISOString();

        // PostgreSQL will interpret this correctly
        query = query
            .gte("start_date", firstDay) // >= first day of month
            .lt("start_date", nextMonthFirst); // < first day of next month
    }

    if (carId) {
        query = query.eq('car_id', carId)
    }

    if (status) {
        query = query.eq("rental_status", status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching rentals calendar:", error);
        return [];
    }

    return Promise.all(
        (data ?? []).map((row: any) =>
            toRentalDTO(row, row.car_id)
        )
    );
}



async function toRentalDTO(rental: Rental, carId: string): Promise<Rental> {

    const carWithImage = await fetchCarWithImagesById(carId);

    rental.car = carWithImage;

    return rental;
}
