import { FavoriteCar, Rental, RentalDTO, BorrowRequest } from '../../../types';
import { supabase } from '../../supabase';
import { fetchCarIdsByQuery, fetchCarWithImagesById, fetchImagesByCarName } from '../cars/cars';
import { getLoggedUser } from '../user/profile';


export async function getUserRentals(): Promise<RentalDTO[]> {

    const user = await getLoggedUser();

    const { data } = await supabase
        .from('Rentals')
        .select('*')
        .eq('user_id', user?.id)

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

        // Get options - if not in rental, try to fetch from linked request
        let rentalOptions = rental.options;
        if (!rentalOptions && rental.request_id) {
            try {
                const { data: requestData } = await supabase
                    .from('BorrowRequest')
                    .select('options')
                    .eq('id', rental.request_id)
                    .single();
                
                if (requestData?.options) {
                    rentalOptions = requestData.options;
                }
            } catch (err) {
                console.debug('Could not fetch options from linked request:', err);
            }
        }

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

                let mainImage: string | null = null;
                let photoGallery: string[] = [];

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
                    photo_gallery: photoGallery || ([] as string[]),
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

        // Ensure price_per_day is a number, not a string
        const pricePerDay = rental.price_per_day 
            ? (typeof rental.price_per_day === 'string' ? parseFloat(rental.price_per_day) : rental.price_per_day)
            : undefined;

        return {
            ...rental,
            id: rental.id, // Explicitly include id
            car: car || null,
            // Ensure all critical fields are present with proper types
            price_per_day: pricePerDay,
            options: rentalOptions || undefined,
            request_id: rental.request_id,
            contract_url: rental.contract_url,
        } as RentalDTO;
    }));

    return processedRentals;
}

export async function getUserBorrowRequests(): Promise<BorrowRequest[]> {
    const user = await getLoggedUser();

    // Build query to get requests for this user
    let query = supabase
        .from('BorrowRequest')
        .select('*');

    // Include requests where user is the owner OR where customer_email matches
    if (user?.id && user?.email) {
        query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
    } else if (user?.id) {
        query = query.eq('user_id', user.id);
    } else if (user?.email) {
        query = query.eq('customer_email', user.email);
    }

    const { data } = await query.order('requested_at', { ascending: false });

    // If no borrow requests found, return empty array
    if (!data || data.length === 0) {
        return [];
    }

    // Collect all unique car IDs
    const carIds = new Set<number>();
    data.forEach((request: any) => {
        if (request.car_id) {
            const carId = typeof request.car_id === 'number' ? request.car_id : parseInt(request.car_id);
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
            }
        } catch (error) {
            console.error('Error fetching cars for borrow requests:', error);
        }
    }

    // Process the borrow requests to include car data with images AND linked rental data
    const processedRequests = await Promise.all(data.map(async (request: any) => {
        // Find the car for this request
        const carId = typeof request.car_id === 'number' ? request.car_id : parseInt(request.car_id);
        let car = cars.find((c: any) => c.id === carId);

        // FETCH LINKED RENTAL DATA (if this request has been converted to a rental)
        let linkedRental = null;
        try {
            const { data: rentalData, error: rentalError } = await supabase
                .from('Rentals')
                .select('id, price_per_day, total_amount, contract_url')
                .eq('request_id', request.id)
                .single();
            
            if (!rentalError && rentalData) {
                linkedRental = rentalData;
            }
        } catch (err) {
            console.debug('No linked rental found for request', request.id);
        }

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

                let mainImage: string | null = null;
                let photoGallery: string[] = [];

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
                    photo_gallery: photoGallery || ([] as string[]),
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
            ...request,
            car: car || null,
            // Include rental data if it exists
            linkedRental: linkedRental,
            // Override price_per_day and total_amount with rental values if available
            price_per_day: linkedRental?.price_per_day || undefined,
            total_amount: linkedRental?.total_amount || undefined,
            contract_url: linkedRental?.contract_url || request.contract_url,
        };
    }));

    return processedRequests;
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
            const car = await fetchCarWithImagesById(carId.toString());
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

    // Convert rentals using DTO mapping
    const rentals: Rental[] = await Promise.all(
        data.map(async (rentalRow: Rental) => {
            return toRentalDTO(rentalRow, rentalRow.car_id);
        })
    );

    return rentals;
}

const ACTIVE_RENTAL_STATUS = 'ACTIVE';

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

    // Convert rentals using DTO mapping
    const rentals: RentalDTO[] = await Promise.all(
        data.map(async (rentalRow: Rental) => {
            return toRentalDTO(rentalRow, rentalRow.car_id);
        })
    );

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

/**
 * Method just for the user !!!
 * @param carId 
 * @param month 
 * @param status 
 * @returns 
 */
export async function fetchUserRentalsForCalendarPage(
    carId?: string,
    month?: Date,
    status?: string
): Promise<Rental[]> {
    const user = await getLoggedUser();
    if (!user) return [];

    let query = supabase
        .from("Rentals")
        .select("*");

    // Filter by month (expects "YYYY-MM")
    if (month) {
        const year = month.getFullYear();
        const m = month.getMonth(); // 0-based: Jan = 0, Dec = 11

        // First day of current month
        const firstDay = formatDateForSQL(year, m, 1);

        // First day of next month using JS Date rollover
        const nextMonthDate = new Date(year, m + 1, 1);
        const nextMonthFirst = formatDateForSQL(
            nextMonthDate.getFullYear(),
            nextMonthDate.getMonth(), // always 0–11
            1
        );

        query = query
            .lt("start_date", nextMonthFirst)
            .gte("end_date", firstDay);
    }


    if (carId) {
        // if there is a selected car, fetch the orders for that car
        query = query.eq('car_id', carId)
    } else {
        // otherwise fetch user's calendar 
        query = query.eq("user_id", user.id)
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

export async function toRentalDTO(rental: Rental, carId: string): Promise<RentalDTO> {

    const carWithImage = await fetchCarWithImagesById(carId);

    return {
        ...rental,
        car: carWithImage
    }
}


export function formatDateForSQL(year: number, month: number, day: number): string {
    // month is 0-based, so increase by 1
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d} 00:00:00`;
}