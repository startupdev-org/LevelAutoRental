import { supabase } from '../../../supabase';
import { Car, CarFilterOptions } from '../../../../types';
import { fetchCarWithImagesById, fetchImagesByCarName } from '../cars';

/**
 * Filter interface for car queries
 */
export interface CarFilters {
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    drivetrain?: string;
    transmission?: 'Automatic' | 'Manual';
    fuelType?: 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' | undefined;
    seats?: number;
    status?: string;
}

/**
 * Fetch the cars from the database
 * @returns Car[]
 */
export async function fetchCars(): Promise<Car[]> {
    try {
        const { data, error } = await supabase
            .from("Cars")
            .select("*")
            .or('status.is.null,status.neq.deleted')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching cars:', error);
            return [];
        }

        return data ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchCars:', err);
        return [];
    }
}

/**
 * Fetch the cars make from the database
 */
export async function fetchCarsMake() {
    try {
        console.log('fetching cars make from database');
        const { data, error } = await supabase
            .from("Cars")
            .select("make");

        if (error) {
            console.error('Error fetching cars make:', error);
            return [];
        }

        // console.log('cars make fetched: ', data);

        // Make them distinct
        const distinctMakes = [...new Set(data.map(car => car.make))];

        return distinctMakes;
    } catch (err) {
        console.error('Unexpected error in fetchCars:', err);
        return [];
    }
}

/**
 * Fetch the cars models from the database
 */
export async function fetchCarsModels(make: string): Promise<string[]> {
    try {
        // console.log('fetching model for car make: ', make);
        const { data, error } = await supabase
            .from("Cars")
            .select("model")
            .eq("make", make);

        if (error) {
            console.error('Error fetching ' + make + ' models:', error);
            return [];
        }

        // console.log('the fetched models are: ', data)

        return data?.map(item => item.model) ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchCars:', err);
        return [];
    }
}

export async function fetchFilteredCarsWithPhotos(filters: CarFilters): Promise<(Car & { mainImage?: string })[]> {
    try {
        const filteredCars = await fetchFilteredCars(filters);

        const carsWithImages = await Promise.all(
            filteredCars.map(async (car) => {
                // Assume folder name is based on the car name in lowercase and dash-separated
                const carName = car.make + ' ' + car.model;
                const { mainImage, photoGallery } = await fetchImagesByCarName(carName)
                return {
                    ...car,
                    image_url: mainImage,
                    photo_gallery: photoGallery
                };
            })
        );

        console.log('cars with images are: ', carsWithImages)

        return carsWithImages;
    } catch (err) {
        console.error('Error fetching filtered cars with photos:', err);
        return [];
    }
}
/**
 * Fetch filtered cars from the database
 * @param filters - Filter criteria
 * @returns Car[]
 */
export async function fetchFilteredCars(filters: CarFilters): Promise<Car[]> {
    try {
        console.log('fetching filtered cars from database', filters);

        let query = supabase
            .from("Cars")
            .select("*");

        // Apply status filter (exclude deleted)
        query = query.or('status.is.null,status.neq.deleted');

        // Apply make filter
        if (filters.make) {
            // Handle cases where make might be "Mercedes-AMG" or "Mercedes AMG"
            const makeParts = filters.make.split(' ');
            const firstPart = makeParts[0];
            // Check if make contains the filter (case-insensitive)
            query = query.ilike('make', `${firstPart}%`);
        }

        // Apply model filter (model is part of the make field in this database structure)
        if (filters.model) {
            // Since model is stored as part of make field (e.g., "Mercedes AMG C43"),
            // we search in the make field for the model
            query = query.ilike('model', `%${filters.model}%`);
        }

        // Apply price range filter
        if (
            filters.minPrice !== undefined &&
            filters.minPrice !== null &&
            typeof filters.minPrice === "number" &&
            Number.isFinite(filters.minPrice)
        ) {
            query = query.gte('price_per_day', filters.minPrice);
        }

        if (
            filters.maxPrice !== undefined &&
            filters.maxPrice !== null &&
            typeof filters.maxPrice === "number" &&
            Number.isFinite(filters.maxPrice)
        ) {
            query = query.lte('price_per_day', filters.maxPrice);
        }

        // Apply year range filter
        if (filters.minYear !== undefined) {
            query = query.gte('year', filters.minYear);
        }
        if (filters.maxYear !== undefined) {
            query = query.lte('year', filters.maxYear);
        }

        // Apply transmission filter
        if (filters.transmission) {
            query = query.eq('transmission', filters.transmission);
        }

        // Apply fuel type filter
        if (filters.fuelType) {
            // Map display fuel types to database values
            const fuelTypeMap: Record<string, string> = {
                'Petrol': 'gasoline',
                'Gasoline': 'gasoline',
                'Diesel': 'diesel',
                'Electric': 'electric',
                'Hybrid': 'hybrid'
            };
            const dbFuelType = fuelTypeMap[filters.fuelType] || filters.fuelType.toLowerCase();
            query = query.eq('fuel_type', dbFuelType);
        }

        // Apply seats filter
        if (typeof filters.seats === 'number' &&
            Number.isFinite(filters.seats)) {
            query = query.eq('seats', filters.seats);
        }


        // Apply status filter (if specific status requested)
        if (filters.status && filters.status !== 'Any' && filters.status !== 'All') {
            query = query.eq('status', filters.status);
        }

        // Order by id
        query = query.order('id', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching filtered cars:', error);
            return [];
        }

        console.log('!!!! filtered cars fetched: ', data);

        return data ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchFilteredCars:', err);
        return [];
    }
}

/**
 * Fetch cars just with the main image
 * @returns 
 */
export async function fetchCarsWithMainImage(): Promise<(Car[])> {
    const cars = await fetchCars();

    const carsWithImages = await Promise.all(
        cars.map(async (car) => {
            // Assume folder name is based on the car name in lowercase and dash-separated
            const carName = car.make + ' ' + car.model;
            const { mainImage } = await fetchImagesByCarName(carName)
            return {
                ...car,
                image_url: mainImage,
            };
        })
    );

    console.log('cars with main image: ', carsWithImages)

    return carsWithImages;
}

/**
 * Fetch cars just with full photo gallery
 *  
 */
export async function fetchCarsWithPhotos(): Promise<(Car[])> {
    const cars = await fetchCars();

    const carsWithImages = await Promise.all(
        cars.map(async (car) => {
            // Assume folder name is based on the car name in lowercase and dash-separated
            const carName = car.make + ' ' + car.model;
            const { mainImage, photoGallery } = await fetchImagesByCarName(carName)
            return {
                ...car,
                image_url: mainImage,
                photo_gallery: photoGallery
            };
        })
    );

    return carsWithImages;
}

export async function fetchCarsWithMainImageFiltered(filters: CarFilterOptions): Promise<Car[]> {
    console.log('the filters are: ', filters)

    let query = supabase.from('Cars').select('*');

    if (filters.searchQuery) {
        const search = `%${filters.searchQuery}%`;
        query = query.or(`make.ilike.${search},model.ilike.${search}`);
    }

    if (filters.status !== null) {
        query = query.eq("status", filters.status)
    }

    // Apply sorting
    if (filters.sortBy === "price") {
        query = query.order("price_per_day", { ascending: filters.sortOrder === "asc" });
    }

    if (filters.sortBy === "year") {
        query = query.order("year", { ascending: filters.sortOrder === "asc" });
    }

    const { data: cars, error } = await query;

    if (error) {
        console.error('Error fetching filtered cars:', error);
        return [];
    }

    // Attach images
    const carsWithImages = await Promise.all(
        cars.map(async (car) => {
            const carName = `${car.make} ${car.model}`;
            const { mainImage } = await fetchImagesByCarName(carName);

            return {
                ...car,
                image_url: mainImage,
            };
        })
    );

    return carsWithImages;
}
