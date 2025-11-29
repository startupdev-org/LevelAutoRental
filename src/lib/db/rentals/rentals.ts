import { Car, FavoriteCar, User } from '../../../types';
import { Rental } from '../../orders';
import { supabase } from '../../supabase';
import { fetchCarIdsByQuery, fetchCarWithImagesById, fetchImagesByCarName } from '../cars/cars';
import { getLoggedUser, getProfile } from '../user/profile';


export async function getUserRentals(): Promise<Rental[]> {

    const user = await getLoggedUser();

    const { data } = await supabase
        .from('Rentals')
        .select('*')
        .eq('user_id', user?.id)

    console.log('user rentals: ', data);

    // If no rentals found, return empty array
    if (!data || data.length === 0) {
        return [];
    }

    // Collect all unique car IDs
    const carIds = new Set<number>();
    data.forEach((rental: any) => {
        if (rental.car_id) {
            const carId = typeof rental.car_id === 'number' ? rental.car_id : parseInt(rental.car_id);
            carIds.add(carId);
        }
    });

    // Fetch all cars at once
    let cars: any[] = [];
    if (carIds.size > 0) {
        try {
            const { data: carsData, error } = await supabase
                .from('Cars')
                .select('*')
                .in('id', Array.from(carIds));

            if (!error && carsData) {
                cars = carsData;
                console.log('Fetched cars data:', cars);
            }
        } catch (error) {
            console.error('Error fetching cars for rentals:', error);
        }
    }

    // Process the rentals to include car data with images
    const processedRentals = await Promise.all(data.map(async (rental: any) => {
        // Find the car for this rental
        const carId = typeof rental.car_id === 'number' ? rental.car_id : parseInt(rental.car_id);
        let car = cars.find((c: any) => c.id === carId);
        console.log('Processing rental for car ID:', carId, 'Found car:', car);

        // If car exists, ensure it has images from storage
        if (car) {
            try {
                // Try multiple variations of the car name to find images
                const carNameVariations = [
                    car.name,
                    `${car.make} ${car.model}`,
                    car.model, // Just the model in case that's how folders are named
                    `${car.make}-${car.model}`.toLowerCase(),
                ].filter(Boolean);

                let mainImage = null;
                let photoGallery = [];

                // Try each variation until we find images
                for (const carName of carNameVariations) {
                    try {
                        const result = await fetchImagesByCarName(carName as string);
                        if (result.mainImage) {
                            mainImage = result.mainImage;
                            photoGallery = result.photoGallery;
                            console.log('✅ Found images for car:', carName, '->', mainImage);
                            break;
                        }
                    } catch (e) {
                        // Continue to next variation
                    }
                }

                // Override any existing image_url with the fresh one from storage
                car = {
                    ...car,
                    image_url: mainImage || car.image_url || '/placeholder-car.jpg',
                    photo_gallery: photoGallery || [],
                };

            } catch (error) {
                console.error('❌ Error fetching storage images for', car.make, car.model, ':', error);
                // Fallback to database image or placeholder
                car = {
                    ...car,
                    image_url: car.image_url || '/placeholder-car.jpg'
                };
            }
        }

        return {
            ...rental,
            car: car || null,
        };
    }));

    return processedRentals;
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

export async function fetchFavoriteCarsFromStorage(): Promise<FavoriteCar[]> {
    // Get favorite car IDs from localStorage
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

    const favoriteCarIds = getFavorites();

    if (favoriteCarIds.length === 0) {
        return [];
    }

    // Fetch car details for each favorite car ID
    const favoriteCars: FavoriteCar[] = [];

    for (const carId of favoriteCarIds) {
        try {
            const car = await fetchCarWithImagesById(carId);
            if (car) {
                favoriteCars.push({
                    car,
                    lastRental: null, // We don't have rental history for localStorage favorites
                    borrowCount: null
                });
            }
        } catch (error) {
            console.error(`Error fetching car ${carId}:`, error);
            // Continue with other cars even if one fails
        }
    }

    return favoriteCars;
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


export async function fetchUserRentalsForCalendarPage(
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
        const m = month.getMonth();

        const firstDay = formatDateForSQL(year, m, 1);
        const nextMonthFirst = formatDateForSQL(year, m + 1, 1);

        query = query
            .lt("start_date", nextMonthFirst)
            .gte("end_date", firstDay);
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


function formatDateForSQL(year: number, month: number, day: number): string {
    // month is 0-based, so increase by 1
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d} 00:00:00`;
}