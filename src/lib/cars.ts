import { supabase, supabaseAdmin } from './supabase';
import { Car } from '../types';

// Database row type
interface CarRow {
  id: number;
  make: string;
  model: string;
  name: string | null;
  year: number | null;
  price_per_day: number;
  status: string | null;
  body: string | null;
  transmission: string | null;
  drivetrain: string | null;
  seats: number | null;
  features: string[] | null;
  category: string | null;
  image_url: string | null;
  photo_gallery: string[] | null;
  fuel_type: string | null;
  rating: number | null;
  reviews: number | null;
  pickup_date: string | null;
  return_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Map database row to Car type
const mapCarRowToCar = (row: CarRow): Car & { name?: string } => {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    name: row.name || undefined,
    year: row.year || new Date().getFullYear(),
    price_per_day: row.price_per_day,
    category: (row.category as 'suv' | 'sports' | 'luxury') || undefined,
    image_url: row.image_url || undefined,
    photo_gallery: row.photo_gallery || undefined,
    seats: row.seats || undefined,
    transmission: (row.transmission as 'Automatic' | 'Manual') || undefined,
    body: (row.body as 'Coupe' | 'Sedan' | 'SUV') || undefined,
    fuel_type: (row.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol') || undefined,
    features: row.features || undefined,
    rating: row.rating || undefined,
    reviews: row.reviews || undefined,
    status: row.status || undefined,
    drivetrain: row.drivetrain || undefined,
  };
};

// Fetch all cars from Supabase (excluding deleted cars)
export const fetchCars = async (): Promise<(Car & { name?: string })[]> => {
  try {
    const { data, error } = await supabase
      .from('Cars')
      .select('*')
      .or('status.is.null,status.neq.deleted')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(mapCarRowToCar);
  } catch (error) {
    console.error('Error in fetchCars:', error);
    throw error;
  }
};

// Fetch a single car by ID
export const fetchCarById = async (id: number): Promise<(Car & { name?: string }) | null> => {
  try {
    const { data, error } = await supabase
      .from('Cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching car:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapCarRowToCar(data);
  } catch (error) {
    console.error('Error in fetchCarById:', error);
    return null;
  }
};

// Create a new car
export const createCar = async (carData: Partial<Car>): Promise<Car | null> => {
  try {
    const insertData: any = {
      make: carData.make || '',
      model: carData.model || '',
      name: (carData as any).name || null,
      year: carData.year || new Date().getFullYear(),
      price_per_day: carData.price_per_day || 0,
      status: carData.status || 'available',
      body: carData.body || null,
      transmission: carData.transmission || null,
      drivetrain: carData.drivetrain || null,
      seats: carData.seats || null,
      category: carData.category || null,
      image_url: carData.image_url || null,
      photo_gallery: carData.photo_gallery || [],
      fuel_type: carData.fuel_type || null,
      features: carData.features || [],
      rating: carData.rating || 0,
      reviews: carData.reviews || 0,
    };

    // Use admin client for admin operations (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('Cars')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating car:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapCarRowToCar(data);
  } catch (error) {
    console.error('Error in createCar:', error);
    throw error;
  }
};

// Update an existing car
export const updateCar = async (id: number, carData: Partial<Car>): Promise<Car | null> => {
  try {
    const updateData: any = {};

    if (carData.make !== undefined) updateData.make = carData.make;
    if (carData.model !== undefined) updateData.model = carData.model;
    if ((carData as any).name !== undefined) updateData.name = (carData as any).name;
    if (carData.year !== undefined) updateData.year = carData.year;
    if (carData.price_per_day !== undefined) updateData.price_per_day = carData.price_per_day;
    if (carData.status !== undefined) updateData.status = carData.status;
    if (carData.body !== undefined) updateData.body = carData.body;
    if (carData.transmission !== undefined) updateData.transmission = carData.transmission;
    if (carData.drivetrain !== undefined) updateData.drivetrain = carData.drivetrain;
    if (carData.seats !== undefined) updateData.seats = carData.seats;
    if (carData.category !== undefined) updateData.category = carData.category;
    // Handle both image and image_url fields
    if ((carData as any).image !== undefined || carData.image_url !== undefined) {
      updateData.image_url = (carData as any).image || carData.image_url;
    }
    // Handle both photoGallery and photo_gallery fields
    if ((carData as any).photoGallery !== undefined || carData.photo_gallery !== undefined) {
      updateData.photo_gallery = (carData as any).photoGallery || carData.photo_gallery;
    }
    if (carData.fuel_type !== undefined) updateData.fuel_type = carData.fuel_type;
    if (carData.features !== undefined) updateData.features = carData.features;
    if (carData.rating !== undefined) updateData.rating = carData.rating;
    if (carData.reviews !== undefined) updateData.reviews = carData.reviews;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      console.warn('No fields to update');
      // Fetch and return the current car data
      return await fetchCarById(id);
    }

    // Use admin client for admin operations (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('Cars')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating car:', updateError);
      throw updateError;
    }

    // Then fetch the updated car
    const updatedCar = await fetchCarById(id);
    if (!updatedCar) {
      throw new Error('Car not found after update');
    }

    return updatedCar;
  } catch (error) {
    console.error('Error in updateCar:', error);
    throw error;
  }
};

// Delete a car
export const deleteCar = async (id: number): Promise<boolean> => {
  try {
    // Use admin client for admin operations (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('Cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting car:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCar:', error);
    throw error;
  }
};

