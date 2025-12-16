import { supabase, supabaseAdmin } from './supabase';
import { Car } from '../types';

// Database row type
interface CarRow {
  id: number;
  make: string;
  model: string;
  name: string | null;
  year: number | null;
  price_2_4_days?: number | null;
  price_5_15_days?: number | null;
  price_16_30_days?: number | null;
  price_over_30_days?: number | null;
  discount_percentage?: number | null;
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
  color?: string | null;
  license?: string | null;
  kilometers?: number | null;
}

// Map database row to Car type
const mapCarRowToCar = (row: CarRow): Car & { name?: string; color?: string; license?: string; kilometers?: number } => {
  // Handle category: can be string (single), array (multiple), or JSON string
  let category: ('suv' | 'sports' | 'luxury') | ('suv' | 'sports' | 'luxury')[] | undefined = undefined;
  if (row.category) {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(row.category);
      if (Array.isArray(parsed)) {
        category = parsed as ('suv' | 'sports' | 'luxury')[];
      } else {
        // Single value
        category = parsed as 'suv' | 'sports' | 'luxury';
      }
    } catch {
      // Not JSON, treat as single string value (backward compatibility)
      category = row.category as 'suv' | 'sports' | 'luxury';
    }
  }

  return {
    id: row.id,
    make: row.make,
    model: row.model,
    name: row.name || undefined,
    year: row.year || new Date().getFullYear(),
    price_per_day: row.price_per_day || row.price_2_4_days || undefined,
    price_2_4_days: row.price_2_4_days || undefined,
    price_5_15_days: row.price_5_15_days || undefined,
    price_16_30_days: row.price_16_30_days || undefined,
    price_over_30_days: row.price_over_30_days || undefined,
    discount_percentage: row.discount_percentage || undefined,
    category: category,
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
    mileage: row.kilometers || undefined,
    // Include additional fields for contract generation
    color: row.color || undefined,
    license: row.license || undefined,
    kilometers: row.kilometers || undefined,
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
    // Handle category: convert array to JSON string, or keep single value as string
    let categoryValue: string | null = null;
    if (carData.category) {
      if (Array.isArray(carData.category)) {
        categoryValue = JSON.stringify(carData.category);
      } else {
        categoryValue = carData.category as string;
      }
    }

    const insertData: any = {
      make: carData.make || '',
      model: carData.model || '',
      name: (carData as any).name || null,
      year: carData.year || new Date().getFullYear(),
      price_2_4_days: (carData as any).price_2_4_days || null,
      price_5_15_days: (carData as any).price_5_15_days || null,
      price_16_30_days: (carData as any).price_16_30_days || null,
      price_over_30_days: (carData as any).price_over_30_days || null,
      discount_percentage: carData.discount_percentage !== undefined ? carData.discount_percentage : null,
      status: carData.status || 'available',
      body: carData.body || null,
      transmission: carData.transmission || null,
      drivetrain: carData.drivetrain || null,
      seats: carData.seats || null,
      category: categoryValue,
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

    console.log('updateCar called with data:', carData);

    if (carData.make !== undefined) updateData.make = carData.make;
    if (carData.model !== undefined) updateData.model = carData.model;
    if ((carData as any).name !== undefined) updateData.name = (carData as any).name;
    if (carData.year !== undefined) updateData.year = carData.year;
    if ((carData as any).price_2_4_days !== undefined) updateData.price_2_4_days = (carData as any).price_2_4_days;
    if ((carData as any).price_5_15_days !== undefined) updateData.price_5_15_days = (carData as any).price_5_15_days;
    if ((carData as any).price_16_30_days !== undefined) updateData.price_16_30_days = (carData as any).price_16_30_days;
    if ((carData as any).price_over_30_days !== undefined) updateData.price_over_30_days = (carData as any).price_over_30_days;

    console.log('updateData prepared:', updateData);
    if (carData.discount_percentage !== undefined) updateData.discount_percentage = carData.discount_percentage;
    if (carData.status !== undefined) updateData.status = carData.status;
    if (carData.body !== undefined) updateData.body = carData.body;
    if (carData.transmission !== undefined) updateData.transmission = carData.transmission;
    if (carData.drivetrain !== undefined) updateData.drivetrain = carData.drivetrain;
    if (carData.seats !== undefined) updateData.seats = carData.seats;
    if (carData.category !== undefined) {
      // Handle category: convert array to JSON string, or keep single value as string
      if (Array.isArray(carData.category)) {
        updateData.category = JSON.stringify(carData.category);
      } else {
        updateData.category = carData.category as string;
      }
    }
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

