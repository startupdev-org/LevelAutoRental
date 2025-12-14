import { supabase, supabaseAdmin } from './supabase';
import { BorrowRequest, Car, OrderDisplay, Rental } from '../types';
import { fetchImagesByCarName } from './db/cars/cars';
import { fetchUserProfiles } from './db/user/profile';
import { fetchBorrowRequests } from './db/requests/requests';

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
 * Fetch only rentals (not requests) and format them for display
 */
export async function fetchRentalsOnly(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const rentals = await fetchRentals();

    // If no data from database, return empty array
    if (rentals.length === 0) {
      return [];
    }

    // Collect all unique user IDs (filter out null/undefined for guest bookings)
    const userIds = new Set<string>();
    rentals.forEach(r => {
        if (r.user_id) userIds.add(r.user_id);
    });

    // Fetch user profiles if available
    const profilesArray = await fetchUserProfiles(Array.from(userIds));
    const profiles = new Map<string, any>();
    profilesArray.forEach(profile => {
        if (profile.id) {
            profiles.set(profile.id, profile);
        }
    });

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
    const requestContractUrlMap = new Map<number, string>();
    if (requestIds.size > 0) {
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('BorrowRequest')
          .select('id, customer_name, customer_email, customer_phone, customer_first_name, customer_last_name, options, contract_url')
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
            // Store contract URL for later use
            if (request.contract_url) {
              requestContractUrlMap.set(request.id, request.contract_url);
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
        const profile = rental.user_id ? profiles.get(rental.user_id) : null;
        email = profile?.email || rental.user?.email || '';
        phone = profile?.phone || '';
        firstName = profile?.firstName || '';
        lastName = profile?.lastName || '';
        userName = (firstName && lastName)
          ? `${firstName} ${lastName}`
          : firstName || lastName
            ? `${firstName}${lastName}`
            : (email ? email.split('@')[0] : '')
            || (rental.user_id ? `User ${rental.user_id.slice(0, 8)}` : 'Guest User');
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
        contract_url: rental.contract_url || (rentalRequestId && requestContractUrlMap.has(typeof rentalRequestId === 'number' ? rentalRequestId : parseInt(rentalRequestId))
          ? requestContractUrlMap.get(typeof rentalRequestId === 'number' ? rentalRequestId : parseInt(rentalRequestId))
          : undefined),
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
 * Fetch all orders (both requests and rentals) and format them for display
 */
export async function fetchAllOrders(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const [requests, rentals] = await Promise.all([
      fetchBorrowRequests(),
      fetchRentals(),
    ]);

    // Collect all unique user IDs (filter out null/undefined for guest bookings)
    const userIds = new Set<string>();
    requests.forEach(r => {
        if (r.user_id) userIds.add(r.user_id);
    });
    rentals.forEach(r => {
        if (r.user_id) userIds.add(r.user_id);
    });

    // Fetch user profiles if available
    const profilesArray = await fetchUserProfiles(Array.from(userIds));
    const profiles = new Map<string, any>();
    profilesArray.forEach(profile => {
        if (profile.id) {
            profiles.set(profile.id, profile);
        }
    });

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
        pickupDate: request.start_date.includes(' ') ? request.start_date.split(' ')[0] : request.start_date.split('T')[0],
        pickupTime: request.start_time || (request.start_date.includes(' ') ? request.start_date.split(' ')[1] : request.start_time),
        returnDate: request.end_date.includes(' ') ? request.end_date.split(' ')[0] : request.end_date.split('T')[0],
        returnTime: request.end_time || (request.end_date.includes(' ') ? request.end_date.split(' ')[1] : request.end_time),
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
      const profile = rental.user_id ? profiles.get(rental.user_id) : null;
      const email = profile?.email || rental.user?.email || '';
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : firstName || lastName
          ? `${firstName}${lastName}`
          : (email ? email.split('@')[0] : '')
          || (rental.user_id ? `User ${rental.user_id.slice(0, 8)}` : 'Guest User');

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
    return [];
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
          console.warn(`No rental found for approved request ${request.id}`);
          continue;
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

          // Also update the BorrowRequest status to APPROVED when start date has passed
          const { error: updateRequestError } = await supabase
            .from('BorrowRequest')
            .update({
              status: 'APPROVED',
              updated_at: new Date().toISOString()
            })
            .eq('id', request.id);

          if (updateRequestError) {
            console.error(`Error updating request status to APPROVED for request ${request.id}:`, updateRequestError);
            continue;
          }

          processed++;
        }

        // Update car status to "booked" when rental becomes ACTIVE
        await updateCarStatusBasedOnRentals(request.car_id);
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
    // First, get the rental to find the car_id and request_id
    const { data: rental, error: fetchError } = await supabase
      .from('Rentals')
      .select('car_id, request_id')
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

    // If this rental was created from a request, update the request status back to PENDING
    if (rental.request_id) {
      const { error: requestError } = await supabase
        .from('BorrowRequest')
        .update({
          status: 'PENDING',
          updated_at: new Date().toISOString()
        })
        .eq('id', rental.request_id);

      if (requestError) {
        console.error('Error updating borrow request status:', requestError);
        // Don't fail the entire operation if request update fails
      }
    }

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

