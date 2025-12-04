import { BorrowRequest, BorrowRequestDTO, Car } from '../../../types';
import { supabase, supabaseAdmin } from '../../supabase';
import { fetchCarIdsByQuery, fetchCarWithImagesById } from '../cars/cars';



/**
 * 
 * @param borrowRequest 
 * @returns 
 */
/**
 * Save a borrow request using admin client to bypass RLS policies
 * @param borrowRequest The borrow request data to save
 * @returns The saved borrow request data
 */
export async function saveBorrowRequest(borrowRequest: any) {
    try {
        // Use supabaseAdmin to bypass RLS policies for borrow request creation
        // This allows unauthenticated users to create borrow requests
        const { data, error } = await supabaseAdmin
            .from('BorrowRequest')
            .insert([borrowRequest])
            .select();

        if (error) {
            console.error('Error saving borrow request:', error.message);
            throw error;
        }

        console.log('Borrow request saved successfully:', data);
        return data;
    } catch (err) {
        console.error('Unexpected error saving borrow request:', err);
        throw err;
    }
}

/**
 * Fetch all borrow requests from Supabase
 */
export async function fetchBorrowRequests(): Promise<BorrowRequest[]> {
    try {
        const { data, error } = await supabase
            .from('BorrowRequest')
            .select('*')
            .order('requested_at', { ascending: false });

        if (error) {
            console.error('Error fetching borrow requests:', error);
            return [];
        }
        return data;

    } catch (error) {
        console.error('Error in fetchBorrowRequests:', error);
        return [];
    }
}

export interface BorrowRequestFilters {
    searchQuery?: string;
    sortBy?: 'amount' | 'start_date' | string,
    sortOrder?: boolean;
    status?: string;
}

/**
 * Fetch borrow requests formatted for display
 */
export async function fetchBorrowRequestsForDisplay(
    page = 1,
    limit = 10,
    filters?: BorrowRequestFilters
): Promise<{ data: BorrowRequestDTO[]; total: number }> {
    try {
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('BorrowRequest')
            .select('*', { count: 'exact' })


        // searchQuery
        if (filters?.searchQuery?.trim()) {
            const carIds = await fetchCarIdsByQuery(filters.searchQuery)

            // If no cars match -> return empty instantly
            if (!carIds.length) {
                return { data: [], total: 0 }
            }

            query = query.in('car_id', carIds)
        }

        // status 
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        // status
        if (filters?.sortBy) {
            query = query.order('total_amount', {
                ascending: filters?.sortOrder ?? false
            })
        } else {
            // default
            query = query.order('start_date', { ascending: false })
        }

        // pagination logic
        query = query.range(from, to)

        const { data: allRequests, count, error } = await query

        if (error) {
            console.error('Error fetching requests:', error)
            return { data: [], total: 0 }
        }

        const borrowRequestDTOs = await Promise.all(
            allRequests.map(async (request) => {
                const car = await fetchCarWithImagesById(request.car_id)
                return toBorrowRequestDTO(request, car)
            })
        )

        return { data: borrowRequestDTOs, total: count || 0 }

    } catch (err) {
        console.error('Unexpected error fetching requests:', err)
        return { data: [], total: 0 }
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
            // Check if a rental already exists for this request
            const { data: existingRental } = await supabase
                .from('Rentals')
                .select('id')
                .eq('request_id', parseInt(requestId))
                .single();

            if (existingRental) {
                console.log('Request already approved with existing rental:', existingRental.id);
                return { success: true, rentalId: existingRental.id.toString() };
            }
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
        console.log('Updating request status to APPROVED for request:', requestId);
        const { error: updateError } = await supabase
            .from('BorrowRequest')
            .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
            .eq('id', requestId);

        if (updateError) {
            console.error('Error updating request status:', updateError);
            return { success: false, error: 'Failed to update request status: ' + updateError.message };
        }
        console.log('Request status updated to APPROVED successfully');

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
        // Store as local time, not UTC, to avoid timezone conversion issues
        const formatTimestamp = (dateStr: string, timeStr: string): string => {
            // If dateStr is already a full timestamp, use it
            if (dateStr.includes('T') || dateStr.includes(' ')) {
                return dateStr;
            }
            // Otherwise combine date and time as local time string
            // Format: YYYY-MM-DD HH:MM:SS (local time)
            // Ensure time has seconds format
            const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2
                ? `${timeStr}:00`
                : timeStr;
            return `${dateStr} ${timeWithSeconds}`;
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


export function toBorrowRequestDTO(
    borrowRequest: BorrowRequest,
    car?: Car
): BorrowRequestDTO {
    return {
        ...borrowRequest,
        car,
    };
}