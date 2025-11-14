import { supabase } from './supabase';
import { Car } from '../types';

export interface BorrowRequest {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  total_amount?: number;
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
  id: number,
  carId: string,
  userId: string,
  avatar: string,
  pickupDate: string,
  returnDate: string,
  pickupTime: string,
  returnTime: string,

  total_amount: string,


  status: string
}

/**
 * Fetch all borrow requests from Supabase
 */
export async function fetchBorrowRequests(): Promise<BorrowRequest[]> {
  try {
    const { data, error } = await supabase
      .from('borrow_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching borrow requests:', error);
      return [];
    }

    // Map to include user structure (email will be empty, can be populated from profiles table if available)
    return (data || []).map((request: any) => ({
      ...request,
      user: {
        id: request.user_id,
        email: '', // Will be populated from profiles table if available
        user_metadata: {},
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
      .from('rentals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
      return [];
    }

    // Map to include user structure (email will be empty, can be populated from profiles table if available)
    return (data || []).map((rental: any) => ({
      ...rental,
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
    // Try to fetch from profiles table if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone')
      .in('id', userIds);

    if (!error && data) {
      data.forEach((profile: any) => {
        profileMap.set(profile.id, {
          email: profile.email || '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone || '',
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
    { name: 'Ion Popescu', email: 'ion.popescu@example.com' },
    { name: 'Maria Ionescu', email: 'maria.ionescu@example.com' },
    { name: 'Gheorghe Radu', email: 'gheorghe.radu@example.com' },
    { name: 'Elena Stan', email: 'elena.stan@example.com' },
    { name: 'Nicolae Dumitru', email: 'nicolae.dumitru@example.com' },
    { name: 'Ana Constantinescu', email: 'ana.constantinescu@example.com' },
    { name: 'Alexandru Munteanu', email: 'alexandru.munteanu@example.com' },
    { name: 'Natalia Nistor', email: 'natalia.nistor@example.com' },
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

    mockOrders.push({
      id: `req-${Date.now()}-${i}`,
      type: 'request',
      customerName: customer.name,
      customerEmail: customer.email,
      carName: car.name,
      carImage: car.image,
      startDate: startDate.toISOString().split('T')[0],
      startTime: ['08:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '02:00 PM'][i],
      endDate: endDate.toISOString().split('T')[0],
      endTime: ['05:00 PM', '06:30 PM', '07:00 PM', '08:00 PM', '09:00 PM'][i],
      status: statuses[i],
      amount: 0,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 1}`,
    });
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
    const amount = car.pricePerDay * days;

    const statuses: ('ACTIVE' | 'COMPLETED' | 'CANCELLED')[] = ['ACTIVE', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

    mockOrders.push({
      id: `rental-${Date.now()}-${i}`,
      type: 'rental',
      customerName: customer.name,
      customerEmail: customer.email,
      carName: car.name,
      carImage: car.image,
      startDate: startDate.toISOString().split('T')[0],
      startTime: ['08:00 AM', '09:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:30 PM', '03:00 PM'][i],
      endDate: endDate.toISOString().split('T')[0],
      endTime: ['05:00 PM', '06:00 PM', '07:30 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:30 PM', '12:00 PM'][i],
      status: statuses[i],
      amount: amount,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 10}`,
    });
  }

  // Sort by creation date (newest first)
  return mockOrders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fetch only rentals (not requests) and format them for display
 */
export async function fetchRentalsOnly(cars: Car[]): Promise<OrderDisplay[]> {
  try {
    const rentals = await fetchRentals();

    // If no data from database, return mock rentals only
    if (rentals.length === 0) {
      return generateMockRentals(cars);
    }

    // Collect all unique user IDs
    const userIds = new Set<string>();
    rentals.forEach(r => userIds.add(r.user_id));

    // Fetch user profiles if available
    const profiles = await fetchUserProfiles(Array.from(userIds));

    const orders: OrderDisplay[] = [];

    // Process rentals only
    rentals.forEach((rental) => {
      const car = cars.find((c) => c.id.toString() === rental.car_id);
      const profile = profiles.get(rental.user_id);
      const email = profile?.email || rental.user?.email || '';
      const phone = profile?.phone || '';
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : firstName || lastName
          ? `${firstName}${lastName}`
          : (email ? email.split('@')[0] : '')
          || `User ${rental.user_id.slice(0, 8)}`;

      // Calculate amount based on days and car price
      const startDate = new Date(rental.start_date);
      const endDate = new Date(rental.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? car.pricePerDay * days : 0);

      orders.push({
        id: rental.id,
        type: 'rental',
        customerName: userName,
        customerEmail: email,
        customerPhone: phone || '+373 123 456 789',
        carName: car?.name || 'Unknown Car',
        carImage: car?.image || '',
        startDate: rental.start_date,
        startTime: rental.start_time,
        endDate: rental.end_date,
        endTime: rental.end_time,
        status: rental.status,
        amount: amount,
        createdAt: rental.created_at,
        carId: rental.car_id,
        userId: rental.user_id,
      });
    });

    // Sort by creation date (newest first)
    return orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error in fetchRentalsOnly:', error);
    // Return mock rentals on error
    return generateMockRentals(cars);
  }
}

/**
 * Generate mock rentals only (no requests)
 */
function generateMockRentals(cars: Car[]): OrderDisplay[] {
  const now = new Date();
  const mockCustomers = [
    { name: 'Ion Popescu', email: 'ion.popescu@example.com', phone: '+373 123 456 789' },
    { name: 'Maria Ionescu', email: 'maria.ionescu@example.com', phone: '+373 234 567 890' },
    { name: 'Gheorghe Radu', email: 'gheorghe.radu@example.com', phone: '+373 345 678 901' },
    { name: 'Elena Stan', email: 'elena.stan@example.com', phone: '+373 456 789 012' },
    { name: 'Nicolae Dumitru', email: 'nicolae.dumitru@example.com', phone: '+373 567 890 123' },
    { name: 'Ana Constantinescu', email: 'ana.constantinescu@example.com', phone: '+373 678 901 234' },
    { name: 'Alexandru Munteanu', email: 'alexandru.munteanu@example.com', phone: '+373 789 012 345' },
    { name: 'Natalia Nistor', email: 'natalia.nistor@example.com', phone: '+373 890 123 456' },
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
    const amount = car.pricePerDay * days;

    const statuses: ('ACTIVE' | 'COMPLETED' | 'CANCELLED')[] = ['ACTIVE', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ACTIVE', 'COMPLETED'];

    mockOrders.push({
      id: `rental-${Date.now()}-${i}`,
      type: 'rental',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      carName: car.name,
      carImage: car.image,
      startDate: startDate.toISOString().split('T')[0],
      startTime: ['08:00 AM', '09:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:30 PM', '03:00 PM', '09:30 AM', '10:00 AM'][i],
      endDate: endDate.toISOString().split('T')[0],
      endTime: ['05:00 PM', '06:00 PM', '07:30 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:30 PM', '12:00 PM', '06:30 PM', '07:00 PM'][i],
      status: statuses[i],
      amount: amount,
      createdAt: createdDate.toISOString(),
      carId: car.id.toString(),
      userId: `user-${i + 10}`,
    });
  }

  // Sort by creation date (newest first)
  return mockOrders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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

    // Process borrow requests
    requests.forEach((request) => {
      const car = cars.find((c) => c.id.toString() === request.car_id);
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

      orders.push({
        id: request.id,
        type: 'request',
        customerName: userName,
        customerEmail: email,
        carName: car?.name || 'Unknown Car',
        carImage: car?.image || '',
        startDate: request.start_date,
        startTime: request.start_time,
        endDate: request.end_date,
        endTime: request.end_time,
        status: request.status,
        amount: 0, // Requests don't have amounts yet
        createdAt: request.created_at,
        carId: request.car_id,
        userId: request.user_id,
      });
    });

    // Process rentals
    rentals.forEach((rental) => {
      const car = cars.find((c) => c.id.toString() === rental.car_id);
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
      const startDate = new Date(rental.start_date);
      const endDate = new Date(rental.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? car.pricePerDay * days : 0);

      orders.push({
        id: rental.id,
        type: 'rental',
        customerName: userName,
        customerEmail: email,
        carName: car?.name || 'Unknown Car',
        carImage: car?.image || '',
        startDate: rental.start_date,
        startTime: rental.start_time,
        endDate: rental.end_date,
        endTime: rental.end_time,
        status: rental.status,
        amount: amount,
        createdAt: rental.created_at,
        carId: rental.car_id,
        userId: rental.user_id,
      });
    });

    // Sort by creation date (newest first)
    return orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error in fetchAllOrders:', error);
    // Return mock data on error
    return generateMockOrders(cars);
  }
}

