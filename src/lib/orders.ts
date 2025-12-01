import { supabase, supabaseAdmin } from './supabase';
import { Car } from '../types';
import { fetchImagesByCarName } from './db/cars/cars';

/**
 * Update car status based on rental status
 * - If rental is ACTIVE, set car to "booked"
 * - If rental is COMPLETED or CANCELLED, check if car has other ACTIVE rentals
 *   If no other ACTIVE rentals exist, set car to "available"
 */
export async function updateCarStatusBasedOnRentals(carId: number | string): Promise<void> {
  try {
    const dbCarId = typeof carId === 'number' ? carId : parseInt(carId.toString(), 10);

    // Check if there are any ACTIVE rentals for this car
    const { data: activeRentals, error: checkError } = await supabase
      .from('Rentals')
      .select('id')
      .eq('car_id', dbCarId)
      .eq('rental_status', 'ACTIVE');

    if (checkError) {
      console.error('Error checking active rentals for car:', checkError);
      return;
    }

    // If there are active rentals, set car to "booked", otherwise set to "available"
    const newStatus = (activeRentals && activeRentals.length > 0) ? 'booked' : 'available';

    // Update car status using admin client to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('Cars')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbCarId);

    if (updateError) {
      console.error('Error updating car status:', updateError);
    }
  } catch (error) {
    console.error('Error in updateCarStatusBasedOnRentals:', error);
  }
}

export interface BorrowRequest {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
    };
  };
  car?: Car;
}

export interface Rental {
  id: string;
  request_id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  rental_status: string;
  total_amount?: number;
  subtotal?: number;
  taxes_fees?: number;
  additional_taxes?: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
    };
  };
  car?: Car;
}

export interface OrderDisplay {
  id: number | string,
  carId: string,
  userId: string,
  avatar: string,
  pickupDate: string,
  returnDate: string,
  pickupTime: string,
  returnTime: string,
  total_amount: string,
  status: string,
  customerName?: string,
  customerEmail?: string,
  customerPhone?: string,
  customerFirstName?: string,
  customerLastName?: string,
  customerAge?: string | number,
  carName?: string,
  createdAt?: string,
  type?: 'request' | 'rental',
  amount?: number,
  contract_url?: string,
  features?: string[] | any,
  options?: any,
  request_id?: string | number,
}

/**
 * Fetch all borrow requests from Supabase
 */
export async function fetchBorrowRequests(): Promise<BorrowRequest[]> {
  try {
    // Try with regular client first
    const { data, error } = await supabase
      .from('BorrowRequest')
      .select('*')
      .order('requested_at', { ascending: false });

    // If error or no data, try with admin client (bypasses RLS)
    if (error || !data || data.length === 0) {
      try {
        const { supabaseAdmin } = await import('./supabase');

        if (!import.meta.env.VITE_SUPABASE_SERVICE_KEY) {
          return [];
        }

        // Get full data with admin client
        const fullResult = await supabaseAdmin
          .from('BorrowRequest')
          .select('*')
          .order('requested_at', { ascending: false });

        if (fullResult.error) {
          return [];
        }

        if (fullResult.data && fullResult.data.length > 0) {
          // Map admin data to request format
          return fullResult.data.map((request: any) => ({
            id: request.id.toString(),
            user_id: request.user_id,
            car_id: request.car_id.toString(),
            start_date: request.start_date,
            start_time: request.start_time || '09:00:00',
            end_date: request.end_date,
            end_time: request.end_time || '17:00:00',
            status: request.status || 'PENDING',
            created_at: request.requested_at || request.created_at,
            updated_at: request.updated_at,
            customer_name: request.customer_name,
            customer_first_name: request.customer_first_name,
            customer_last_name: request.customer_last_name,
            customer_email: request.customer_email,
            customer_phone: request.customer_phone,
            customer_age: request.customer_age,
            comment: request.comment,
            options: request.options || {},
            total_amount: request.total_amount,
            user: {
              id: request.user_id,
              email: request.customer_email || '',
              user_metadata: {
                first_name: request.customer_first_name,
                last_name: request.customer_last_name,
                full_name: request.customer_name,
              },
            },
          }));
        }
      } catch (importError) {
        // Silently fail if admin client is not available
      }
    }

    if (error) {
      console.error('Error fetching borrow requests:', error);
      return [];
    }

    // Map to include user structure and normalize field names
    return (data || []).map((request: any) => ({
      id: request.id.toString(),
      user_id: request.user_id,
      car_id: request.car_id.toString(),
      start_date: request.start_date,
      start_time: request.start_time || '09:00:00',
      end_date: request.end_date,
      end_time: request.end_time || '17:00:00',
      status: request.status || 'PENDING',
      created_at: request.requested_at || request.created_at,
      updated_at: request.updated_at,
      // Include customer information and options from the new schema
      customer_name: request.customer_name,
      customer_first_name: request.customer_first_name,
      customer_last_name: request.customer_last_name,
      customer_email: request.customer_email,
      customer_phone: request.customer_phone,
      customer_age: request.customer_age,
      comment: request.comment,
      options: request.options || {},
      total_amount: request.total_amount,
      user: {
        id: request.user_id,
        email: request.customer_email || '', // Use customer_email from request
        user_metadata: {
          first_name: request.customer_first_name,
          last_name: request.customer_last_name,
          full_name: request.customer_name,
        },
      },
    }));
  } catch (error) {
    console.error('Error in fetchBorrowRequests:', error);
    return [];
  }
}

/**
 * Fetch all rentals from Supabase
 */
export async function fetchRentals(): Promise<Rental[]> {
  try {
    const { data, error } = await supabase
      .from('Rentals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
      return [];
    }

    // Map to include user structure and normalize status field
    return (data || []).map((rental: any) => ({
      ...rental,
      status: rental.rental_status || rental.status, // Map rental_status to status
      user: {
        id: rental.user_id,
        email: '', // Will be populated from profiles table if available
        user_metadata: {},
      },
    }));
  } catch (error) {
    console.error('Error in fetchRentals:', error);
    return [];
  }
}

/**
 * Fetch user profiles if profiles table exists
 */
async function fetchUserProfiles(userIds: string[]): Promise<Map<string, { email: string; firstName?: string; lastName?: string; phone?: string }>> {
  const profileMap = new Map<string, { email: string; firstName?: string; lastName?: string; phone?: string }>();

  if (userIds.length === 0) return profileMap;

  try {
    // Fetch from Profiles table (capitalized to match your table name)
    const { data, error } = await supabase
      .from('Profiles')
      .select('id, email, first_name, last_name, phone_number')
      .in('id', userIds);

    if (!error && data) {
      data.forEach((profile: any) => {
        profileMap.set(profile.id, {
          email: profile.email || '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone_number || '',
        });
      });
    }
  } catch (error) {
    // Profiles table might not exist, that's okay
    console.debug('Profiles table not available or error fetching:', error);
  }

  return profileMap;
}

/**
 * Generate mock orders for demonstration purposes
 */
function generateMockOrders(cars: Car[]): OrderDisplay[] {
  const now = new Date();
  const mockCustomers = [
    { firstName: 'Ion', lastName: 'Popescu', name: 'Ion Popescu', email: 'ion.popescu@example.com', phone: '+373 123 456 789', age: 28 },
    { firstName: 'Maria', lastName: 'Ionescu', name: 'Maria Ionescu', email: 'maria.ionescu@example.com', phone: '+373 234 567 890', age: 35 },
    { firstName: 'Gheorghe', lastName: 'Radu', name: 'Gheorghe Radu', email: 'gheorghe.radu@example.com', phone: '+373 345 678 901', age: 42 },
    { firstName: 'Elena', lastName: 'Stan', name: 'Elena Stan', email: 'elena.stan@example.com', phone: '+373 456 789 012', age: 29 },
    { firstName: 'Nicolae', lastName: 'Dumitru', name: 'Nicolae Dumitru', email: 'nicolae.dumitru@example.com', phone: '+373 567 890 123', age: 31 },
    { firstName: 'Ana', lastName: 'Constantinescu', name: 'Ana Constantinescu', email: 'ana.constantinescu@example.com', phone: '+373 678 901 234', age: 26 },
    { firstName: 'Alexandru', lastName: 'Munteanu', name: 'Alexandru Munteanu', email: 'alexandru.munteanu@example.com', phone: '+373 789 012 345', age: 38 },
    { firstName: 'Natalia', lastName: 'Nistor', name: 'Natalia Nistor', email: 'natalia.nistor@example.com', phone: '+373 890 123 456', age: 33 },
  ];

  const mockOrders: OrderDisplay[] = [];

  // Generate mock borrow requests
  for (let i = 0; i < 5; i++) {
    const car = cars[i % cars.length];
    const customer = mockCustomers[i % mockCustomers.length];
    const daysAgo = i * 2;
    const createdDate = new Date(now);
    createdDate.setDate(createdDate.getDate() - daysAgo);

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + (i + 1) * 3);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (i % 3) + 2);

    const statuses: ('PENDING' | 'APPROVED' | 'REJECTED')[] = ['PENDING', 'APPROVED', 'REJECTED', 'PENDING', 'APPROVED'];

    // Mock options for requests - different combinations for variety
    const mockOptionsList = [
      { unlimitedKm: true, speedLimitIncrease: true },
      { pickupAtAddress: true, returnAtAddress: true, personalDriver: true },
      { unlimitedKm: true, tireInsurance: true, childSeat: true },
      { priorityService: true, simCard: true, roadsideAssistance: true },
      { pickupAtAddress: true, unlimitedKm: true, personalDriver: true, tireInsurance: true },
    ];

    mockOrders.push({
      id: `req-${Date.now()}-${i}`,
      type: 'request',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      customerAge: customer.age,
      carName: (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim(),
      avatar: (car as any)?.image || car.image_url || '',
      pickupDate: startDate.toISOString().split('T')[0],
      pickupTime: ['08:00', '09:30', '10:00', '11:00', '14:00'][i],
      returnDate: endDate.toISOString().split('T')[0],
      returnTime: ['17:00', '18:30', '19:00', '20:00', '21:00'][i],
      status: statuses[i],
      total_amount: '0',
      amount: 0,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 1}`,
      options: mockOptionsList[i % mockOptionsList.length],
    } as OrderDisplay & { options?: any });
  }

  // Generate mock rentals
  for (let i = 0; i < 8; i++) {
    const car = cars[(i + 2) % cars.length];
    const customer = mockCustomers[(i + 3) % mockCustomers.length];
    const daysAgo = i * 1.5;
    const createdDate = new Date(now);
    createdDate.setDate(createdDate.getDate() - Math.floor(daysAgo));

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (i % 4));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (i % 5) + 3);

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = ((car as any)?.pricePerDay || car.price_per_day || 0) * days;

    const statuses: ('ACTIVE' | 'COMPLETED' | 'CANCELLED')[] = ['ACTIVE', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

    mockOrders.push({
      id: `rental-${Date.now()}-${i}`,
      type: 'rental',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      customerAge: customer.age,
      carName: (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim(),
      avatar: (car as any)?.image || car.image_url || '',
      pickupDate: startDate.toISOString().split('T')[0],
      pickupTime: ['08:00', '09:00', '10:30', '11:00', '12:00', '13:00', '14:30', '15:00'][i],
      returnDate: endDate.toISOString().split('T')[0],
      returnTime: ['17:00', '18:00', '19:30', '20:00', '21:00', '22:00', '23:30', '00:00'][i],
      status: statuses[i],
      total_amount: amount.toString(),
      amount: amount,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 10}`,
    });
  }

  // Sort by creation date (newest first)
  return mockOrders.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Fetch only rentals (not requests) and format them for display
 */
export async function fetchRentalsOnly(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const rentals = await fetchRentals();

    // If no data from database, return empty array
    if (rentals.length === 0) {
      return [];
    }

    // Collect all unique user IDs
    const userIds = new Set<string>();
    rentals.forEach(r => userIds.add(r.user_id));

    // Fetch user profiles if available
    const profiles = await fetchUserProfiles(Array.from(userIds));

    const orders: OrderDisplay[] = [];

    // Collect all request IDs from rentals that have them
    const requestIds = new Set<number>();
    rentals.forEach(r => {
      const requestId = (r as any).request_id;
      if (requestId) {
        requestIds.add(typeof requestId === 'number' ? requestId : parseInt(requestId));
      }
    });

    // Fetch customer information and options from BorrowRequest table for rentals created from requests
    const requestCustomerMap = new Map<number, { name: string; email: string; phone: string; firstName?: string; lastName?: string }>();
    const requestOptionsMap = new Map<number, any>();
    if (requestIds.size > 0) {
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('BorrowRequest')
          .select('id, customer_name, customer_email, customer_phone, customer_first_name, customer_last_name, options')
          .in('id', Array.from(requestIds));

        if (!requestsError && requestsData) {
          requestsData.forEach((request: any) => {
            requestCustomerMap.set(request.id, {
              name: request.customer_name || '',
              email: request.customer_email || '',
              phone: request.customer_phone || '',
              firstName: request.customer_first_name,
              lastName: request.customer_last_name,
            });
            // Store options for later use
            if (request.options) {
              requestOptionsMap.set(request.id, request.options);
            }
          });
        }
      } catch (err) {
        console.debug('Error fetching customer info from requests:', err);
      }
    }

    // Process rentals only - use Promise.all to handle async car fetching
    const processedOrders = await Promise.all(rentals.map(async (rental) => {
      // Handle both string and number car_id
      const carIdMatch = typeof rental.car_id === 'number'
        ? rental.car_id
        : parseInt(rental.car_id);

      let car = cars.find((c) => c.id === carIdMatch || c.id.toString() === rental.car_id?.toString());

      // If car not found (might be deleted), fetch it directly from database
      if (!car && rental.car_id) {
        try {
          const { data: carData, error } = await supabase
            .from('Cars')
            .select('*')
            .eq('id', carIdMatch)
            .single();

          if (!error && carData) {
            // Map database row to Car type
            car = {
              id: carData.id,
              make: carData.make,
              model: carData.model,
              name: carData.name || undefined,
              year: carData.year || new Date().getFullYear(),
              price_per_day: carData.price_per_day,
              discount_percentage: carData.discount_percentage || undefined,
              category: carData.category as 'suv' | 'sports' | 'luxury' || undefined,
              image_url: carData.image_url || undefined,
              photo_gallery: carData.photo_gallery || undefined,
              seats: carData.seats || undefined,
              transmission: carData.transmission as 'Automatic' | 'Manual' || undefined,
              body: carData.body as 'Coupe' | 'Sedan' | 'SUV' || undefined,
              fuel_type: carData.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' || undefined,
              features: carData.features || undefined,
              rating: carData.rating || undefined,
              reviews: carData.reviews || undefined,
              status: carData.status || undefined,
              drivetrain: carData.drivetrain || undefined,
            } as Car & { name?: string };

            // Fetch images from storage for this car
            if (car) {
              const carName = (car as any).name || `${car.make} ${car.model}`;
              const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
              car.image_url = mainImage || car.image_url;
              car.photo_gallery = photoGallery.length > 0 ? photoGallery : car.photo_gallery;
            }
          }
        } catch (err) {
          console.error(`Error fetching car ${carIdMatch} from database:`, err);
        }
      }

      // Get customer information - prefer from request if rental was created from a request
      const requestId = (rental as any).request_id;
      const requestCustomer = requestId ? requestCustomerMap.get(typeof requestId === 'number' ? requestId : parseInt(requestId)) : null;

      let email = '';
      let phone = '';
      let firstName = '';
      let lastName = '';
      let userName = '';

      if (requestCustomer) {
        // Use customer info from the original request
        email = requestCustomer.email;
        phone = requestCustomer.phone;
        firstName = requestCustomer.firstName || '';
        lastName = requestCustomer.lastName || '';
        userName = requestCustomer.name ||
          (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email.split('@')[0] || 'Unknown');
      } else {
        // Fallback to profile lookup
        const profile = profiles.get(rental.user_id);
        email = profile?.email || rental.user?.email || '';
        phone = profile?.phone || '';
        firstName = profile?.firstName || '';
        lastName = profile?.lastName || '';
        userName = (firstName && lastName)
          ? `${firstName} ${lastName}`
          : firstName || lastName
            ? `${firstName}${lastName}`
            : (email ? email.split('@')[0] : '')
            || `User ${rental.user_id.slice(0, 8)}`;
      }

      // Calculate amount based on days and car price
      const startDate = new Date(rental.start_date || new Date());
      const endDate = new Date(rental.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0);

      // Format dates properly
      const formatDate = (dateStr: string | Date | null | undefined): string => {
        if (!dateStr) return '';
        if (typeof dateStr === 'string') {
          // If it's already in YYYY-MM-DD format, return as is
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateStr.split('T')[0];
          }
          // Otherwise parse and format
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        }
        return new Date(dateStr).toISOString().split('T')[0];
      };

      // Parse features/options from rental
      // First priority: options from the original request (if rental was created from a request)
      const rentalRequestId = (rental as any).request_id;
      const features = (rental as any).features;
      let options: Record<string, any> | undefined = undefined;

      if (rentalRequestId && requestOptionsMap.has(typeof rentalRequestId === 'number' ? rentalRequestId : parseInt(rentalRequestId))) {
        // Use options from the original request
        options = requestOptionsMap.get(typeof rentalRequestId === 'number' ? rentalRequestId : parseInt(rentalRequestId));
      } else {
        // Fallback to features parsing from rental
        if (features) {
          // If features is an array of strings, convert to options object
          if (Array.isArray(features)) {
            options = {};
            features.forEach((feature: string) => {
              // Map feature names to option keys
              const featureLower = feature.toLowerCase();
              if (featureLower.includes('unlimited') || featureLower.includes('kilometraj')) {
                options!.unlimitedKm = true;
              } else if (featureLower.includes('speed') || featureLower.includes('viteză')) {
                options!.speedLimitIncrease = true;
              } else if (featureLower.includes('tire') || featureLower.includes('anvelope') || featureLower.includes('parbriz')) {
                options!.tireInsurance = true;
              } else if (featureLower.includes('driver') || featureLower.includes('șofer')) {
                options!.personalDriver = true;
              } else if (featureLower.includes('priority')) {
                options!.priorityService = true;
              } else if (featureLower.includes('child') || featureLower.includes('copil') || featureLower.includes('scaun')) {
                options!.childSeat = true;
              } else if (featureLower.includes('sim') || featureLower.includes('card')) {
                options!.simCard = true;
              } else if (featureLower.includes('roadside') || featureLower.includes('asistență') || featureLower.includes('rutieră')) {
                options!.roadsideAssistance = true;
              }
            });
          } else if (typeof features === 'string') {
            try {
              options = JSON.parse(features);
            } catch (e) {
              options = {};
            }
          } else {
            options = features;
          }
        }
      }

      return {
        id: rental.id,
        type: 'rental' as const,
        customerName: userName,
        customerEmail: email,
        customerPhone: phone || '',
        customerFirstName: firstName || undefined,
        customerLastName: lastName || undefined,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: car?.image_url || (car as any)?.image || '',
        pickupDate: formatDate(rental.start_date),
        pickupTime: rental.start_time || '09:00',
        returnDate: formatDate(rental.end_date),
        returnTime: rental.end_time || '17:00',
        status: rental.rental_status || (rental as any).rental_status || 'CONTRACT',
        total_amount: amount.toString(),
        amount: amount,
        createdAt: rental.created_at || new Date().toISOString(),
        carId: rental.car_id?.toString() || '',
        userId: rental.user_id || '',
        contract_url: (rental as any).contract_url || undefined,
        features: features,
        options: options,
        request_id: (rental as any).request_id || undefined,
      } as OrderDisplay;
    }));

    orders.push(...processedOrders);

    // Sort by creation date (newest first)
    return orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error in fetchRentalsOnly:', error);
    // Return empty array on error - only show real data from Supabase
    return [];
  }
}

/**
 * Generate mock rentals only (no requests)
 */
function generateMockRentals(cars: Car[]): OrderDisplay[] {
  const now = new Date();
  const mockCustomers = [
    { firstName: 'Ion', lastName: 'Popescu', name: 'Ion Popescu', email: 'ion.popescu@example.com', phone: '+373 123 456 789', age: 28 },
    { firstName: 'Maria', lastName: 'Ionescu', name: 'Maria Ionescu', email: 'maria.ionescu@example.com', phone: '+373 234 567 890', age: 35 },
    { firstName: 'Gheorghe', lastName: 'Radu', name: 'Gheorghe Radu', email: 'gheorghe.radu@example.com', phone: '+373 345 678 901', age: 42 },
    { firstName: 'Elena', lastName: 'Stan', name: 'Elena Stan', email: 'elena.stan@example.com', phone: '+373 456 789 012', age: 29 },
    { firstName: 'Nicolae', lastName: 'Dumitru', name: 'Nicolae Dumitru', email: 'nicolae.dumitru@example.com', phone: '+373 567 890 123', age: 31 },
    { firstName: 'Ana', lastName: 'Constantinescu', name: 'Ana Constantinescu', email: 'ana.constantinescu@example.com', phone: '+373 678 901 234', age: 26 },
    { firstName: 'Alexandru', lastName: 'Munteanu', name: 'Alexandru Munteanu', email: 'alexandru.munteanu@example.com', phone: '+373 789 012 345', age: 38 },
    { firstName: 'Natalia', lastName: 'Nistor', name: 'Natalia Nistor', email: 'natalia.nistor@example.com', phone: '+373 890 123 456', age: 33 },
  ];

  const mockOrders: OrderDisplay[] = [];

  // Generate mock rentals only
  for (let i = 0; i < 10; i++) {
    const car = cars[(i + 2) % cars.length];
    const customer = mockCustomers[(i + 3) % mockCustomers.length];
    const daysAgo = i * 1.5;
    const createdDate = new Date(now);
    createdDate.setDate(createdDate.getDate() - Math.floor(daysAgo));

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (i % 4));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (i % 5) + 3);

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = ((car as any)?.pricePerDay || car.price_per_day || 0) * days;

    const statuses: ('ACTIVE' | 'COMPLETED' | 'CANCELLED')[] = ['ACTIVE', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ACTIVE', 'COMPLETED'];

    mockOrders.push({
      id: `rental-${Date.now()}-${i}`,
      type: 'rental',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      customerAge: customer.age,
      carName: (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim(),
      avatar: (car as any)?.image || car.image_url || '',
      pickupDate: startDate.toISOString().split('T')[0],
      pickupTime: ['08:00', '09:00', '10:30', '11:00', '12:00', '13:00', '14:30', '15:00', '09:30', '10:00'][i],
      returnDate: endDate.toISOString().split('T')[0],
      returnTime: ['17:00', '18:00', '19:30', '20:00', '21:00', '22:00', '23:30', '00:00', '18:30', '19:00'][i],
      status: statuses[i],
      total_amount: amount.toString(),
      amount: amount,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 10}`,
    });
  }

  // Add specific overlapping rentals to demonstrate pickup/return on same day
  const overlapDate = new Date(now);
  overlapDate.setDate(overlapDate.getDate() + 3); // 3 days from now
  const overlapDateStr = overlapDate.toISOString().split('T')[0];

  // Rental 1: Returns on overlap date at 10:00
  const rental1Start = new Date(overlapDate);
  rental1Start.setDate(rental1Start.getDate() - 5);
  mockOrders.push({
    id: `rental-overlap-1`,
    type: 'rental',
    customerName: 'Vasile Moraru',
    customerEmail: 'vasile.moraru@example.com',
    customerPhone: '+373 111 222 333',
    customerFirstName: 'Vasile',
    customerLastName: 'Moraru',
    customerAge: 45,
    carName: (cars[0] as any)?.name || `${cars[0]?.make || ''} ${cars[0]?.model || ''}`.trim() || 'BMW 320',
    avatar: (cars[0] as any)?.image || cars[0]?.image_url || '',
    pickupDate: rental1Start.toISOString().split('T')[0],
    pickupTime: '09:00',
    returnDate: overlapDateStr,
    returnTime: '10:00',
    status: 'ACTIVE',
    total_amount: (((cars[0] as any)?.pricePerDay || cars[0]?.price_per_day || 0) * 5 || 500).toString(),
    amount: ((cars[0] as any)?.pricePerDay || cars[0]?.price_per_day || 0) * 5 || 500,
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    carId: cars[0]?.id.toString() || '1',
    userId: 'user-overlap-1',
  });

  // Rental 2: Picks up on overlap date at 11:00 (same car as rental 1 returns)
  const rental2End = new Date(overlapDate);
  rental2End.setDate(rental2End.getDate() + 4);
  mockOrders.push({
    id: `rental-overlap-2`,
    type: 'rental',
    customerName: 'Diana Cretu',
    customerEmail: 'diana.cretu@example.com',
    customerPhone: '+373 444 555 666',
    customerFirstName: 'Diana',
    customerLastName: 'Cretu',
    customerAge: 27,
    carName: (cars[0] as any)?.name || `${cars[0]?.make || ''} ${cars[0]?.model || ''}`.trim() || 'BMW 320',
    avatar: (cars[0] as any)?.image || cars[0]?.image_url || '',
    pickupDate: overlapDateStr,
    pickupTime: '11:00',
    returnDate: rental2End.toISOString().split('T')[0],
    returnTime: '18:00',
    status: 'ACTIVE',
    total_amount: (((cars[0] as any)?.pricePerDay || cars[0]?.price_per_day || 0) * 4 || 400).toString(),
    amount: ((cars[0] as any)?.pricePerDay || cars[0]?.price_per_day || 0) * 4 || 400,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    carId: cars[0]?.id.toString() || '1',
    userId: 'user-overlap-2',
  });

  // Rental 3: Different car returning on overlap date
  mockOrders.push({
    id: `rental-overlap-3`,
    type: 'rental',
    customerName: 'Sergiu Popa',
    customerEmail: 'sergiu.popa@example.com',
    customerPhone: '+373 777 888 999',
    customerFirstName: 'Sergiu',
    customerLastName: 'Popa',
    customerAge: 39,
    carName: (cars[1] as any)?.name || `${cars[1]?.make || ''} ${cars[1]?.model || ''}`.trim() || 'Mercedes CLS',
    avatar: (cars[1] as any)?.image || cars[1]?.image_url || '',
    pickupDate: rental1Start.toISOString().split('T')[0],
    pickupTime: '14:00',
    returnDate: overlapDateStr,
    returnTime: '15:00',
    status: 'ACTIVE',
    total_amount: (((cars[1] as any)?.pricePerDay || cars[1]?.price_per_day || 0) * 5 || 600).toString(),
    amount: ((cars[1] as any)?.pricePerDay || cars[1]?.price_per_day || 0) * 5 || 600,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    carId: cars[1]?.id.toString() || '2',
    userId: 'user-overlap-3',
  });

  // Rental 4: Different car picking up on overlap date
  const rental4End = new Date(overlapDate);
  rental4End.setDate(rental4End.getDate() + 6);
  mockOrders.push({
    id: `rental-overlap-4`,
    type: 'rental',
    customerName: 'Cristina Rusu',
    customerEmail: 'cristina.rusu@example.com',
    customerPhone: '+373 000 111 222',
    customerFirstName: 'Cristina',
    customerLastName: 'Rusu',
    customerAge: 24,
    carName: (cars[2] as any)?.name || `${cars[2]?.make || ''} ${cars[2]?.model || ''}`.trim() || 'Audi A4',
    avatar: (cars[2] as any)?.image || cars[2]?.image_url || '',
    pickupDate: overlapDateStr,
    pickupTime: '13:00',
    returnDate: rental4End.toISOString().split('T')[0],
    returnTime: '17:00',
    status: 'ACTIVE',
    total_amount: (((cars[2] as any)?.pricePerDay || cars[2]?.price_per_day || 0) * 6 || 540).toString(),
    amount: ((cars[2] as any)?.pricePerDay || cars[2]?.price_per_day || 0) * 6 || 540,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    carId: cars[2]?.id.toString() || '3',
    userId: 'user-overlap-4',
  });

  // Sort by creation date (newest first)
  return mockOrders.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Fetch all orders (both requests and rentals) and format them for display
 */
export async function fetchAllOrders(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const [requests, rentals] = await Promise.all([
      fetchBorrowRequests(),
      fetchRentals(),
    ]);

    // If no data from database, return mock data
    if (requests.length === 0 && rentals.length === 0) {
      return generateMockOrders(cars);
    }

    // Collect all unique user IDs
    const userIds = new Set<string>();
    requests.forEach(r => userIds.add(r.user_id));
    rentals.forEach(r => userIds.add(r.user_id));

    // Fetch user profiles if available
    const profiles = await fetchUserProfiles(Array.from(userIds));

    const orders: OrderDisplay[] = [];

    // Process borrow requests - use Promise.all to handle async car fetching
    const processedRequests = await Promise.all(requests.map(async (request) => {
      const carIdMatch = typeof request.car_id === 'number'
        ? request.car_id
        : parseInt(request.car_id.toString(), 10);

      let car = cars.find((c) => c.id === carIdMatch || c.id.toString() === request.car_id?.toString());

      // If car not found (might be deleted), fetch it directly from database
      if (!car && request.car_id) {
        try {
          const { data: carData, error } = await supabase
            .from('Cars')
            .select('*')
            .eq('id', carIdMatch)
            .single();

          if (!error && carData) {
            // Map database row to Car type
            car = {
              id: carData.id,
              make: carData.make,
              model: carData.model,
              name: carData.name || undefined,
              year: carData.year || new Date().getFullYear(),
              price_per_day: carData.price_per_day,
              discount_percentage: carData.discount_percentage || undefined,
              category: carData.category as 'suv' | 'sports' | 'luxury' || undefined,
              image_url: carData.image_url || undefined,
              photo_gallery: carData.photo_gallery || undefined,
              seats: carData.seats || undefined,
              transmission: carData.transmission as 'Automatic' | 'Manual' || undefined,
              body: carData.body as 'Coupe' | 'Sedan' | 'SUV' || undefined,
              fuel_type: carData.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' || undefined,
              features: carData.features || undefined,
              rating: carData.rating || undefined,
              reviews: carData.reviews || undefined,
              status: carData.status || undefined,
              drivetrain: carData.drivetrain || undefined,
            } as Car & { name?: string };

            // Fetch images from storage for this car
            if (car) {
              const carName = (car as any).name || `${car.make} ${car.model}`;
              const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
              car.image_url = mainImage || car.image_url;
              car.photo_gallery = photoGallery.length > 0 ? photoGallery : car.photo_gallery;
            }
          }
        } catch (err) {
          console.error(`Error fetching car ${carIdMatch} from database:`, err);
        }
      }
      const profile = profiles.get(request.user_id);
      const email = profile?.email || request.user?.email || '';
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : firstName || lastName
          ? `${firstName}${lastName}`
          : (email ? email.split('@')[0] : '')
          || `User ${request.user_id.slice(0, 8)}`;

      return {
        id: request.id,
        type: 'request' as const,
        customerName: userName,
        customerEmail: email,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: car?.image_url || (car as any)?.image || '',
        pickupDate: request.start_date,
        pickupTime: request.start_time,
        returnDate: request.end_date,
        returnTime: request.end_time,
        status: request.status,
        total_amount: '0',
        amount: 0, // Requests don't have amounts yet
        createdAt: request.created_at,
        carId: request.car_id,
        userId: request.user_id,
      } as OrderDisplay;
    }));

    orders.push(...processedRequests);

    // Process rentals - use Promise.all to handle async car fetching
    const processedRentals = await Promise.all(rentals.map(async (rental) => {
      const carIdMatch = typeof rental.car_id === 'number'
        ? rental.car_id
        : parseInt(rental.car_id);

      let car = cars.find((c) => c.id === carIdMatch || c.id.toString() === rental.car_id?.toString());

      // If car not found (might be deleted), fetch it directly from database
      if (!car && rental.car_id) {
        try {
          const { data: carData, error } = await supabase
            .from('Cars')
            .select('*')
            .eq('id', carIdMatch)
            .single();

          if (!error && carData) {
            // Map database row to Car type
            car = {
              id: carData.id,
              make: carData.make,
              model: carData.model,
              name: carData.name || undefined,
              year: carData.year || new Date().getFullYear(),
              price_per_day: carData.price_per_day,
              discount_percentage: carData.discount_percentage || undefined,
              category: carData.category as 'suv' | 'sports' | 'luxury' || undefined,
              image_url: carData.image_url || undefined,
              photo_gallery: carData.photo_gallery || undefined,
              seats: carData.seats || undefined,
              transmission: carData.transmission as 'Automatic' | 'Manual' || undefined,
              body: carData.body as 'Coupe' | 'Sedan' | 'SUV' || undefined,
              fuel_type: carData.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' || undefined,
              features: carData.features || undefined,
              rating: carData.rating || undefined,
              reviews: carData.reviews || undefined,
              status: carData.status || undefined,
              drivetrain: carData.drivetrain || undefined,
            } as Car & { name?: string };

            // Fetch images from storage for this car
            if (car) {
              const carName = (car as any).name || `${car.make} ${car.model}`;
              const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
              car.image_url = mainImage || car.image_url;
              car.photo_gallery = photoGallery.length > 0 ? photoGallery : car.photo_gallery;
            }
          }
        } catch (err) {
          console.error(`Error fetching car ${carIdMatch} from database:`, err);
        }
      }
      const profile = profiles.get(rental.user_id);
      const email = profile?.email || rental.user?.email || '';
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : firstName || lastName
          ? `${firstName}${lastName}`
          : (email ? email.split('@')[0] : '')
          || `User ${rental.user_id.slice(0, 8)}`;

      // Calculate amount based on days and car price
      const startDate = new Date(rental.start_date || new Date());
      const endDate = new Date(rental.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0);

      return {
        id: rental.id,
        type: 'rental' as const,
        customerName: userName,
        customerEmail: email,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: car?.image_url || (car as any)?.image || '',
        pickupDate: rental.start_date,
        pickupTime: rental.start_time,
        returnDate: rental.end_date,
        returnTime: rental.end_time,
        status: rental.rental_status || (rental as any).rental_status,
        total_amount: amount.toString(),
        amount: amount,
        createdAt: rental.created_at,
        carId: rental.car_id,
        userId: rental.user_id,
      } as OrderDisplay;
    }));

    orders.push(...processedRentals);

    // Sort by creation date (newest first)
    return orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error in fetchAllOrders:', error);
    // Return mock data on error
    return generateMockOrders(cars);
  }
}

/**
 * Fetch borrow requests formatted for display
 */
export async function fetchBorrowRequestsForDisplay(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const allRequests = await fetchBorrowRequests();
    // Don't filter out EXECUTED requests - let the component handle filtering based on showExecuted state
    const requests = allRequests;

    // If no data from database, return mock requests
    if (requests.length === 0) {
      return generateMockOrders(cars).filter(order => order.type === 'request');
    }

    // Collect all unique user IDs
    const userIds = new Set<string>();
    requests.forEach(r => userIds.add(r.user_id));

    // Fetch user profiles if available
    const profiles = await fetchUserProfiles(Array.from(userIds));

    const orders: OrderDisplay[] = [];

    // Process borrow requests - use Promise.all to handle async car fetching
    const processedRequests = await Promise.all(requests.map(async (request) => {
      const carIdMatch = typeof request.car_id === 'number'
        ? request.car_id
        : parseInt(request.car_id.toString(), 10);

      let car = cars.find((c) => c.id === carIdMatch || c.id.toString() === request.car_id?.toString());

      // If car not found (might be deleted), fetch it directly from database
      if (!car && request.car_id) {
        try {
          const { data: carData, error } = await supabase
            .from('Cars')
            .select('*')
            .eq('id', carIdMatch)
            .single();

          if (!error && carData) {
            // Map database row to Car type
            car = {
              id: carData.id,
              make: carData.make,
              model: carData.model,
              name: carData.name || undefined,
              year: carData.year || new Date().getFullYear(),
              price_per_day: carData.price_per_day,
              discount_percentage: carData.discount_percentage || undefined,
              category: carData.category as 'suv' | 'sports' | 'luxury' || undefined,
              image_url: carData.image_url || undefined,
              photo_gallery: carData.photo_gallery || undefined,
              seats: carData.seats || undefined,
              transmission: carData.transmission as 'Automatic' | 'Manual' || undefined,
              body: carData.body as 'Coupe' | 'Sedan' | 'SUV' || undefined,
              fuel_type: carData.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' || undefined,
              features: carData.features || undefined,
              rating: carData.rating || undefined,
              reviews: carData.reviews || undefined,
              status: carData.status || undefined,
              drivetrain: carData.drivetrain || undefined,
            } as Car & { name?: string };

            // Fetch images from storage for this car
            if (car) {
              const carName = (car as any).name || `${car.make} ${car.model}`;
              const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
              car.image_url = mainImage || car.image_url;
              car.photo_gallery = photoGallery.length > 0 ? photoGallery : car.photo_gallery;
            }
          }
        } catch (err) {
          console.error(`Error fetching car ${carIdMatch} from database:`, err);
        }
      }

      // Use customer data directly from request (new schema) or fall back to profile/user data
      const email = (request as any).customer_email || request.user?.email || '';
      const phone = (request as any).customer_phone || '';
      const firstName = (request as any).customer_first_name || '';
      const lastName = (request as any).customer_last_name || '';
      const customerName = (request as any).customer_name ||
        (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

      const userName = customerName ||
        (email ? email.split('@')[0] : '') ||
        `User ${request.user_id.slice(0, 8)}`;

      // Calculate estimated amount (use stored total_amount if available, otherwise calculate)
      const startDate = new Date(request.start_date || new Date());
      const endDate = new Date(request.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const storedAmount = (request as any).total_amount;
      const calculatedAmount = car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0;
      const amount = storedAmount || calculatedAmount;

      // Get age from request data
      const age = (request as any).customer_age || undefined;

      // Get phone from request data
      const finalPhone = phone || undefined;

      // Parse options if they exist (from JSONB column)
      let options = undefined;
      if ((request as any).options) {
        if (typeof (request as any).options === 'string') {
          try {
            options = JSON.parse((request as any).options);
          } catch (e) {
            options = {};
          }
        } else {
          options = (request as any).options;
        }
      }

      return {
        id: request.id,
        type: 'request',
        customerName: userName,
        customerEmail: email,
        customerPhone: finalPhone,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerAge: age,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: car?.image_url || (car as any)?.image || '',
        pickupDate: request.start_date ? new Date(request.start_date).toISOString().split('T')[0] : '',
        pickupTime: request.start_time || '09:00',
        returnDate: request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : '',
        returnTime: request.end_time || '17:00',
        status: request.status,
        total_amount: amount.toString(),
        amount: amount,
        createdAt: request.created_at,
        carId: request.car_id,
        userId: request.user_id,
        comment: (request as any).comment || undefined,
        options: options || {},
      } as OrderDisplay & { comment?: string; options?: any };
    }));

    orders.push(...processedRequests);

    // Sort by creation date (newest first)
    return orders.sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error in fetchBorrowRequestsForDisplay:', error);
    return generateMockOrders(cars).filter(order => order.type === 'request');
  }
}

/**
 * Accept a borrow request and create a rental
 */
export async function acceptBorrowRequest(requestId: string, cars: Car[]): Promise<{ success: boolean; rentalId?: string; error?: string }> {
  try {
    // Fetch the request
    const { data: request, error: fetchError } = await supabase
      .from('BorrowRequest')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: 'Request is not pending' };
    }

    // Find the car for this request
    const car = cars.find(c => c.id.toString() === request.car_id.toString());
    if (!car) {
      return { success: false, error: 'Car not found for this request' };
    }

    // Get the correct user_id for the rental (should be UUID from Profiles)
    let userId = request.user_id;
    console.log('Processing userId for rental creation:', request.user_id);

    if (typeof request.user_id === 'string' && request.user_id.includes('@')) {
      // Email-based users cannot create rentals directly
      console.error('Cannot create rental for email-based user:', request.user_id);
      return { success: false, error: 'Email-based users cannot create rentals directly' };
    } else if (typeof request.user_id === 'string' && request.user_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // UUID - ensure profile exists
      console.log('Ensuring profile exists for UUID:', request.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('Profiles')
        .select('id')
        .eq('id', request.user_id)
        .single();

      if (profileError || !profileData) {
        console.warn('Profile not found, creating one:', request.user_id);
        const { error: createError } = await supabase
          .from('Profiles')
          .insert({
            id: request.user_id,
            email: null,
            first_name: '',
            last_name: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (createError && createError.code !== '23505') {
          console.error('Error creating profile:', createError);
          return { success: false, error: 'Failed to create user profile' };
        }
        console.log('Created profile for:', request.user_id);
      }
      userId = request.user_id;
    } else if (typeof request.user_id === 'number') {
      userId = request.user_id.toString();
    } else {
      console.error('Unknown userId format:', request.user_id, typeof request.user_id);
      return { success: false, error: 'Invalid user ID format' };
    }

    console.log('Final userId for rental:', userId);

    // Calculate rental amount
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const pricePerDay = (car as any)?.pricePerDay || car.price_per_day || 0;
    const subtotal = pricePerDay * days;
    const taxesFees = subtotal * 0.1;
    const totalAmount = subtotal + taxesFees;

    // Create rental with ACTIVE status
    const { data: rental, error: rentalError } = await supabase
      .from('Rentals')
      .insert({
        request_id: parseInt(requestId),
        user_id: userId,
        car_id: parseInt(request.car_id.toString()),
        start_date: request.start_date,
        start_time: request.start_time || '09:00',
        end_date: request.end_date,
        end_time: request.end_time || '17:00',
        price_per_day: pricePerDay,
        subtotal: subtotal,
        taxes_fees: taxesFees,
        total_amount: totalAmount,
        rental_status: 'ACTIVE',
        payment_status: 'PENDING',
      })
      .select()
      .single();

    if (rentalError) {
      console.error('Error creating rental:', rentalError);
      return { success: false, error: 'Failed to create rental: ' + rentalError.message };
    }

    // Update request status to APPROVED
    const { error: updateError } = await supabase
      .from('BorrowRequest')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      // Don't fail the whole operation if status update fails
    }

    console.log('Successfully created rental with ID:', rental.id);
    return { success: true, rentalId: rental.id.toString() };
  } catch (error) {
    console.error('Error accepting borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Reject a borrow request
 */
export async function rejectBorrowRequest(requestId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('BorrowRequest')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
        // Store rejection reason if there's a notes/comment field
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Undo reject a borrow request (restore to PENDING)
 */
export async function undoRejectBorrowRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('BorrowRequest')
      .update({
        status: 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error undoing reject borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update a borrow request
 */
export async function updateBorrowRequest(
  requestId: string,
  updates: {
    car_id?: string;
    start_date?: string;
    start_time?: string;
    end_date?: string;
    end_time?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_age?: string;
    comment?: string;
    options?: any;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.car_id !== undefined) updateData.car_id = updates.car_id;
    if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
    if (updates.start_time !== undefined) updateData.start_time = updates.start_time;
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
    if (updates.end_time !== undefined) updateData.end_time = updates.end_time;
    if (updates.customer_name !== undefined) updateData.customer_name = updates.customer_name;
    if (updates.customer_email !== undefined) updateData.customer_email = updates.customer_email;
    if (updates.customer_phone !== undefined) updateData.customer_phone = updates.customer_phone;
    if (updates.customer_age !== undefined) updateData.customer_age = updates.customer_age;
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.options !== undefined) updateData.options = typeof updates.options === 'string' ? updates.options : JSON.stringify(updates.options);
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('BorrowRequest')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new borrow request (by admin)
 */
export async function createBorrowRequest(
  carId: string,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  customerName: string,
  customerFirstName: string,
  customerLastName: string,
  customerEmail: string,
  customerPhone: string,
  customerAge?: string,
  comment?: string,
  options?: any,
  totalAmount?: number
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Generate a temporary user_id for admin-created requests
    // In a real scenario, you might want to create a user or use a system user ID
    const userId = `admin-${Date.now()}`;

    const insertData: any = {
      user_id: userId,
      car_id: carId,
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      status: 'APPROVED', // Admin-created requests are automatically approved
      customer_name: customerName,
      customer_first_name: customerFirstName,
      customer_last_name: customerLastName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (customerAge) insertData.customer_age = customerAge;
    if (comment) insertData.comment = comment;
    if (options) insertData.options = typeof options === 'string' ? options : JSON.stringify(options);
    if (totalAmount !== undefined) insertData.total_amount = totalAmount;

    const { data, error } = await supabase
      .from('BorrowRequest')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, requestId: data.id.toString() };
  } catch (error) {
    console.error('Error creating borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new borrow request (by user - status PENDING)
 */
export async function createUserBorrowRequest(
  carId: string,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  customerFirstName: string,
  customerLastName: string,
  customerEmail: string,
  customerPhone: string,
  customerAge?: string,
  comment?: string,
  options?: any,
  totalAmount?: number,
  userId?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Use provided userId (which should be email for logged-in users) or use customerEmail for guest requests
    // Both logged-in users and guests use email as user_id
    const finalUserId = userId || customerEmail;

    // Combine first and last name for customer_name
    const customerName = `${customerFirstName} ${customerLastName}`.trim();

    // Combine date and time into full timestamps for start_date and end_date
    // Database expects timestamp, not just date string
    const formatTimestamp = (dateStr: string, timeStr: string): string => {
      // If dateStr is already a full timestamp, use it
      if (dateStr.includes('T') || dateStr.includes(' ')) {
        return dateStr;
      }
      // Otherwise combine date and time
      const [hours, minutes] = timeStr.split(':');
      const date = new Date(dateStr);
      date.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0, 0);
      return date.toISOString();
    };

    const insertData: any = {
      user_id: finalUserId,
      car_id: parseInt(carId, 10),
      start_date: formatTimestamp(startDate, startTime),
      start_time: startTime,
      end_date: formatTimestamp(endDate, endTime),
      end_time: endTime,
      status: 'PENDING', // User-submitted requests start as PENDING
      customer_name: customerName,
      customer_first_name: customerFirstName,
      customer_last_name: customerLastName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (customerAge) insertData.customer_age = parseInt(customerAge, 10);
    if (comment) insertData.comment = comment;
    if (options) {
      // Ensure options is properly formatted as JSONB for Supabase
      // If it's already an object, Supabase will handle it, but we ensure it's valid JSON
      if (typeof options === 'string') {
        try {
          insertData.options = JSON.parse(options);
        } catch (e) {
          console.error('Error parsing options string:', e);
          insertData.options = {};
        }
      } else if (typeof options === 'object' && options !== null) {
        // Ensure it's a plain object (not a class instance or array)
        insertData.options = JSON.parse(JSON.stringify(options));
      } else {
        insertData.options = {};
      }
    } else {
      // Default to empty object if no options provided
      insertData.options = {};
    }
    if (totalAmount !== undefined) insertData.total_amount = totalAmount;

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session;

    // Use regular supabase client for authenticated users (now that RLS policies are fixed)
    // Fall back to supabaseAdmin for unauthenticated users
    const clientToUse = isAuthenticated ? supabase : supabaseAdmin;

    const { data, error } = await clientToUse
      .from('BorrowRequest')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user borrow request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, requestId: data.id.toString() };
  } catch (error) {
    console.error('Error creating user borrow request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new rental manually (by admin)
 */
export async function createRentalManually(
  userId: string,
  carId: string,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  totalAmount: number,
  cars: Car[],
  options?: {
    subtotal?: number;
    taxesFees?: number;
    additionalTaxes?: number;
    paymentStatus?: string;
    paymentMethod?: string;
    rentalStatus?: 'CONTRACT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    specialRequests?: string;
    features?: string[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerAge?: number;
    requestId?: string | number; // Link to BorrowRequest if rental was created from a request
  }
): Promise<{ success: boolean; rentalId?: string; error?: string }> {
  try {
    const car = cars.find(c => c.id.toString() === carId);
    if (!car) {
      return { success: false, error: 'Car not found' };
    }

    const pricePerDay = (car as any)?.pricePerDay || car.price_per_day || 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    // Calculate subtotal if not provided
    const subtotal = options?.subtotal || (pricePerDay * days);
    // Calculate taxes (10% of subtotal) if not provided
    const taxesFees = options?.taxesFees || (subtotal * 0.1);
    const additionalTaxes = options?.additionalTaxes || 0;
    // Calculate total if not provided
    const calculatedTotal = subtotal + taxesFees + additionalTaxes;
    const finalTotal = totalAmount > 0 ? totalAmount : calculatedTotal;

    const { data: rental, error } = await supabase
      .from('Rentals')
      .insert({
        user_id: userId,
        car_id: parseInt(carId),
        start_date: startDate,
        start_time: startTime || '09:00',
        end_date: endDate,
        end_time: endTime || '17:00',
        price_per_day: pricePerDay,
        subtotal: subtotal,
        taxes_fees: taxesFees,
        additional_taxes: additionalTaxes,
        total_amount: finalTotal,
        rental_status: options?.rentalStatus || 'CONTRACT',
        payment_status: options?.paymentStatus || 'PENDING',
        payment_method: options?.paymentMethod || null,
        notes: options?.notes || null,
        special_requests: options?.specialRequests || null,
        features: options?.features || null,
        request_id: options?.requestId ? (typeof options.requestId === 'string' ? parseInt(options.requestId) : options.requestId) : null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, rentalId: rental.id };
  } catch (error) {
    console.error('Error creating rental manually:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if a date and time has passed
 */
function hasDateTimePassed(date: string, time: string): boolean {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes || 0, 0, 0);
    return new Date() >= dateTime;
  } catch (error) {
    console.error('Error checking date/time:', error);
    return false;
  }
}

/**
 * Update approved requests to executed when pickup time arrives
 */
export async function processActiveRentals(cars: Car[]): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    // Fetch all approved requests that should have active rentals
    const { data: approvedRequests, error: fetchError } = await supabase
      .from('BorrowRequest')
      .select('*')
      .eq('status', 'APPROVED');

    if (fetchError) {
      return { success: false, processed: 0, error: fetchError.message };
    }

    if (!approvedRequests || approvedRequests.length === 0) {
      return { success: true, processed: 0 };
    }

    let processed = 0;

    // Check each approved request
    for (const request of approvedRequests) {
      if (hasDateTimePassed(request.start_date, request.start_time)) {
        // Check if rental already exists for this request (created via contract)
        const { data: existingRental } = await supabase
          .from('Rentals')
          .select('id')
          .eq('request_id', request.id)
          .single();

        if (!existingRental) {
          // No rental exists - this shouldn't happen with the new approval flow
          console.log(`Looking for car with ID ${request.car_id} among ${cars.length} cars`);
          console.log('Available car IDs:', cars.map(c => ({ id: c.id, idType: typeof c.id })));
          const car = cars.find(c => c.id.toString() === request.car_id.toString());
          if (!car) {
            console.error(`Car not found for request ${request.id}. Request car_id: ${request.car_id} (${typeof request.car_id})`);
            continue;
          }

          // Calculate rental amount
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
          const totalAmount = ((car as any)?.pricePerDay || car.price_per_day || 0) * days;

          // Create rental with ACTIVE status
          const { error: rentalError } = await supabase
            .from('Rentals')
            .insert({
              request_id: request.id,
              user_id: request.user_id,
              car_id: request.car_id,
              start_date: request.start_date,
              start_time: request.start_time,
              end_date: request.end_date,
              end_time: request.end_time,
              price_per_day: (car as any)?.pricePerDay || car.price_per_day || 0,
              total_amount: totalAmount,
              rental_status: 'ACTIVE',
              payment_status: 'PENDING',
            });

          if (rentalError) {
            console.error(`Error creating rental for request ${request.id}:`, rentalError);
            continue;
          }

          console.warn(`No rental found for approved request ${request.id}`);
        } else {
          // Rental exists (created via contract) - ensure it's ACTIVE
          const { error: updateRentalError } = await supabase
            .from('Rentals')
            .update({
              rental_status: 'ACTIVE',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRental.id);

          if (updateRentalError) {
            console.error(`Error updating rental for request ${request.id}:`, updateRentalError);
            continue;
          }

          processed++;
          console.log(`Updated rental to ACTIVE for request ${request.id}`);
        }

        // Update car status to "booked" when rental becomes ACTIVE
        await updateCarStatusBasedOnRentals(request.car_id);

        processed++;
      }
    }

    return { success: true, processed };
  } catch (error) {
    console.error('Error processing executed requests:', error);
    return { success: false, processed: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update active orders to completed when return time arrives
 */
export async function processCompletedOrders(): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    // Fetch all active rentals
    const { data: activeRentals, error: fetchError } = await supabase
      .from('Rentals')
      .select('*')
      .eq('rental_status', 'ACTIVE');

    if (fetchError) {
      return { success: false, processed: 0, error: fetchError.message };
    }

    if (!activeRentals || activeRentals.length === 0) {
      return { success: true, processed: 0 };
    }

    let processed = 0;

    // Check each active rental
    for (const rental of activeRentals) {
      if (hasDateTimePassed(rental.end_date, rental.end_time)) {
        // Update rental status to COMPLETED
        const { error: updateError } = await supabase
          .from('Rentals')
          .update({
            rental_status: 'COMPLETED',
            updated_at: new Date().toISOString()
          })
          .eq('id', rental.id);

        if (updateError) {
          console.error(`Error updating rental ${rental.id} to COMPLETED:`, updateError);
          continue;
        }

        // Update car status - check if there are other ACTIVE rentals
        await updateCarStatusBasedOnRentals(rental.car_id);

        processed++;
      }
    }

    return { success: true, processed };
  } catch (error) {
    console.error('Error processing completed orders:', error);
    return { success: false, processed: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Process all status transitions (activate rentals at pickup time and completed orders)
 */
export async function processStatusTransitions(cars: Car[]): Promise<{ success: boolean; executed: number; completed: number; error?: string }> {
  try {
    const [executedResult, completedResult] = await Promise.all([
      processActiveRentals(cars),
      processCompletedOrders()
    ]);

    if (!executedResult.success || !completedResult.success) {
      return {
        success: false,
        executed: executedResult.processed,
        completed: completedResult.processed,
        error: executedResult.error || completedResult.error
      };
    }

    return {
      success: true,
      executed: executedResult.processed,
      completed: completedResult.processed
    };
  } catch (error) {
    console.error('Error processing status transitions:', error);
    return {
      success: false,
      executed: 0,
      completed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Cancel a rental order
 */
export async function cancelRentalOrder(rentalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get the rental to find the car_id
    const { data: rental, error: fetchError } = await supabase
      .from('Rentals')
      .select('car_id')
      .eq('id', rentalId)
      .single();

    if (fetchError || !rental) {
      return { success: false, error: 'Rental not found' };
    }

    const { error } = await supabase
      .from('Rentals')
      .update({
        rental_status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update car status - check if there are other ACTIVE rentals
    await updateCarStatusBasedOnRentals(rental.car_id);

    return { success: true };
  } catch (error) {
    console.error('Error cancelling rental order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Redo (undo cancel) a rental order - restore to CONTRACT status
 */
export async function redoRentalOrder(rentalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('Rentals')
      .update({
        rental_status: 'CONTRACT',
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error redoing rental order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

