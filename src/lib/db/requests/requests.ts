import { BorrowRequest, BorrowRequestDTO, Car, Rental } from '../../../types';
import { getCarPrice } from '../../../utils/car/pricing';
import { getDateDiffInDays } from '../../../utils/date';
import { supabase, supabaseAdmin } from '../../supabase';
import { fetchCarById, fetchCarIdsByQuery, fetchCarWithImagesById } from '../cars/cars';
import { getLoggedUser } from '../user/profile';



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

/**
 * Fetch a single borrow request by ID
 */
export async function fetchBorrowRequestById(requestId: string): Promise<BorrowRequestDTO | null> {
    try {
        const { data, error } = await supabase
            .from('BorrowRequest')
            .select('*')
            .eq('id', parseInt(requestId))
            .single();

        if (error) {
            console.error('Error fetching borrow request by ID:', error);
            return null;
        }

        if (!data) {
            return null;
        }

        // Fetch the car data
        const car = await fetchCarWithImagesById(data.car_id);
        if (!car) {
            console.error('Car not found for request:', data.car_id);
            return null;
        }

        // Use the stored total_amount from database, don't recalculate
        const requestDTO: BorrowRequestDTO = {
            id: data.id.toString(),
            car_id: data.car_id.toString(),
            start_date: data.start_date,
            start_time: data.start_time,
            end_date: data.end_date,
            end_time: data.end_time,
            customer_name: data.customer_name,
            customer_first_name: data.customer_first_name,
            customer_last_name: data.customer_last_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            comment: data.comment,
            options: data.options,
            status: data.status,
            requested_at: data.requested_at,
            updated_at: data.updated_at,
            price_per_day: data.price_per_day?.toString() || '0',
            total_amount: data.total_amount || 0,
            car: car
        };

        return requestDTO;

    } catch (error) {
        console.error('Error in fetchBorrowRequestById:', error);
        return null;
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
export async function acceptBorrowRequest(
    requestId: string
): Promise<{ success: boolean; rentalId?: string; error?: string }> {
    try {
        // 1️⃣ Fetch the pending borrow request
        const { data: request, error: fetchError } = await supabase
            .from('BorrowRequest')
            .select('*')
            .eq('id', requestId)
            .eq('status', 'PENDING')
            .single();

        if (fetchError || !request) {
            return { success: false, error: 'Request not found or not pending' };
        }

        const rentalData: Rental = {
            car_id: request.car_id,
            request_id: request.id,
            rental_status: 'APPROVED',
            start_date: request.start_date,
            start_time: request.start_time,
            end_date: request.end_date,
            end_time: request.end_time,
            price_per_day: request.price_per_day,
            total_amount: request.total_amount,
            subtotal: request.subtotal,
            taxes_fees: request.taxes_fees,
            additional_taxes: request.additional_taxes,
        };

        // If the request has a user_id, set it. Otherwise, use guest_email
        if (request.user_id) {
            rentalData.user_id = request.user_id;
        } else if (request.email) {
            rentalData.customer_email = request.email;
        }

        const { data: rental, error: insertError } = await supabase
            .from('Rentals')
            .insert([rentalData])
            .select()
            .single();

        if (insertError || !rental) {
            return { success: false, error: insertError?.message || 'Failed to create rental' };
        }

        const { error: updateError } = await supabase
            .from('BorrowRequest')
            .update({ status: 'APPROVED' })
            .eq('id', requestId);

        if (updateError) {
            return { success: false, error: updateError.message || 'Failed to update borrow request' };
        }

        return { success: true, rentalId: rental.id };
    } catch (error) {
        console.error('Error accepting borrow request:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
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
        status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
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
    request: BorrowRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {

        console.log('the total amount: ', request.total_amount)

        // Application-level security for guest users (since RLS is disabled)
        if (!request.customer_email || !request.customer_first_name || !request.customer_last_name) {
            throw new Error('Missing required customer information for booking')
        }

        // Input sanitization and validation
        const sanitizeInput = (input: string) => input.trim().substring(0, 100) // Max 100 chars, trim whitespace

        request.customer_email = request.customer_email.toLowerCase().trim()
        request.customer_first_name = sanitizeInput(request.customer_first_name)
        request.customer_last_name = sanitizeInput(request.customer_last_name)
        if (request.customer_phone) {
            request.customer_phone = request.customer_phone.trim().substring(0, 20)
        }
        if (request.comment) {
            request.comment = sanitizeInput(request.comment)
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.customer_email)) {
            throw new Error('Invalid email format')
        }

        // Name validation (basic)
        if (!/^[a-zA-Z\s\-']{2,50}$/.test(request.customer_first_name) ||
            !/^[a-zA-Z\s\-']{2,50}$/.test(request.customer_last_name)) {
            throw new Error('Invalid name format')
        }

        // Validate dates are reasonable (not too far in future/past)
        const startDate = new Date(request.start_date)
        const endDate = new Date(request.end_date)
        const now = new Date()
        const maxFutureDate = new Date()
        maxFutureDate.setMonth(maxFutureDate.getMonth() + 6) // Max 6 months ahead

        if (startDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) || startDate > maxFutureDate) {
            throw new Error('Invalid booking dates - must be today or within 6 months')
        }

        if (endDate <= startDate) {
            throw new Error('End date must be after start date')
        }

        // Enhanced rate limiting and abuse prevention
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentRequests = await supabase
            .from('BorrowRequest')
            .select('id, customer_email, created_at')
            .eq('customer_email', request.customer_email)
            .gte('created_at', oneHourAgo.toISOString())

        // Stricter rate limiting: max 3 requests per hour per email
        if (recentRequests.data && recentRequests.data.length >= 3) {
            console.warn('Rate limit exceeded:', {
                email: request.customer_email,
                recentRequests: recentRequests.data.length,
                timeWindow: '1 hour'
            })
            throw new Error('Too many booking requests. Please wait before submitting another request.')
        }

        // Additional abuse prevention: check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i, /javascript:/i, /on\w+\s*=/i, // XSS attempts
            /(\.\.|\/etc|passwd|shadow)/i, // Path traversal
            /([';]+|union.*select|drop.*table)/i // SQL injection attempts
        ]

        const suspiciousData = [
            request.customer_email,
            request.customer_first_name,
            request.customer_last_name,
            request.comment
        ].filter(field => field && suspiciousPatterns.some(pattern => pattern.test(field)))

        if (suspiciousData.length > 0) {
            console.warn('Suspicious booking request detected:', {
                email: request.customer_email,
                timestamp: new Date().toISOString(),
                suspiciousFields: suspiciousData.length
            })
            throw new Error('Invalid request data. Please check your input.')
        }

        // Validate phone number format (basic)
        if (request.customer_phone && !/^[\d\s\-\+\(\)]{7,20}$/.test(request.customer_phone.replace(/\s/g, ''))) {
            throw new Error('Invalid phone number format')
        }

        let finalUserId: string | null = null;
        try {
            const user = await getLoggedUser()
            if (user !== null)
                finalUserId = user.id
        } catch {
            console.log('the user is not logged in')
            console.log('using null values for the user id')
        }

        const rentalDays = getDateDiffInDays(request.start_date, request.end_date)

        const car = await fetchCarById(request.car_id);

        if (car === null) throw Error('Car not found!')

        const price_per_day_str = getCarPrice(rentalDays, car)
        const price_per_day = parseFloat(price_per_day_str);

        const insertData: BorrowRequest = {
            user_id: finalUserId,
            car_id: request.car_id,
            start_date: request.start_date,
            start_time: request.start_time,
            end_date: request.end_date,
            end_time: request.end_time,
            price_per_day: price_per_day,
            status: 'PENDING', // User-submitted requests start as PENDING
            customer_name: request.customer_name,
            customer_first_name: request.customer_first_name,
            customer_last_name: request.customer_last_name,
            customer_email: request.customer_email,
            customer_phone: request.customer_phone,
            requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_amount: request.total_amount,
            comment: request.comment,
            options: request.options
        };

        const { data, error } = await supabase
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

export async function isDateUnavailable(date: string, carId: string): Promise<boolean> {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const { data, error } = await supabase
        .from('Rentals')
        .select('id')
        .eq('car_id', carId)
        .eq('rental_status', 'APPROVED')
        .lte('start_date', endOfDay)
        .gte('end_date', startOfDay);

    if (error) {
        console.error("Error checking date:", error);
        return false;
    }

    return data.length > 0;
}


export async function isDateInActualApprovedRequest(
    date: string,
    carId: string
): Promise<boolean> {
    console.log(`checking if the car with id: ${carId} is available on: ${date}`)

    const { data, error } = await supabase
        .from('Rentals')
        .select('id')
        .eq('car_id', carId)
        .eq('rental_status', 'APPROVED')
        .lte('start_date', date)
        .gte('end_date', date);

    if (error) {
        console.error('Error checking date in rental:', error.message);
        return false;
    }

    return (data?.length ?? 0) > 0;
}


/**
 * Get the start date of the earliest future approved rental for a car after a given date
 * @param dateString The reference date (YYYY-MM-DD)
 * @param carId The ID of the car
 * @returns The start date string of the next rental, or null if none found
 */
export async function getEarliestFutureRentalStart(
    dateString: Date | string,
    carId: string
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('Rentals')
            .select('start_date')
            .eq('car_id', carId)
            .eq('rental_status', 'APPROVED')
            .gt('start_date', dateString) // only future rentals
            .order('start_date', { ascending: true })
            .limit(1);

        if (error) {
            console.error('Error fetching earliest future rental start:', error.message);
            return null;
        }

        if (!data || data.length === 0) {
            return null; // no future rentals
        }

        return data[0].start_date;
    } catch (err) {
        console.error('Unexpected error in getEarliestFutureRentalStart:', err);
        return null;
    }
}



export function toBorrowRequestDTO(
    borrowRequest: BorrowRequest,
    car: Car
): BorrowRequestDTO {
    return {
        ...borrowRequest,
        car_id: borrowRequest.car_id.toString(),
        price_per_day: borrowRequest.price_per_day.toString(),
        car,
    };
}