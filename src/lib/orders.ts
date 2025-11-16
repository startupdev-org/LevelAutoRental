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
      .neq('rental_status', 'PENDING')
      .neq('rental_status', 'Pending')
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
    })).filter((rental: any) => {
      // Filter out PENDING status rentals
      const status = rental.rental_status || rental.status;
      return status !== 'PENDING' && status !== 'Pending';
    });
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
      const startDate = new Date(rental.start_date || new Date());
      const endDate = new Date(rental.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0);

      orders.push({
        id: rental.id,
        type: 'rental',
        customerName: userName,
        customerEmail: email,
        customerPhone: phone || '+373 123 456 789',
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: (car as any)?.image || car?.image_url || '',
        pickupDate: rental.start_date,
        pickupTime: rental.start_time,
        returnDate: rental.end_date,
        returnTime: rental.end_time,
        status: rental.status || (rental as any).rental_status,
        total_amount: amount.toString(),
        amount: amount,
        createdAt: rental.created_at,
        carId: rental.car_id,
        userId: rental.user_id,
      });
    });

    // Sort by creation date (newest first)
    return orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
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
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: (car as any)?.image || car?.image_url || '',
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
      const startDate = new Date(rental.start_date || new Date());
      const endDate = new Date(rental.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = rental.total_amount || (car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0);

      orders.push({
        id: rental.id,
        type: 'rental',
        customerName: userName,
        customerEmail: email,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: (car as any)?.image || car?.image_url || '',
        pickupDate: rental.start_date,
        pickupTime: rental.start_time,
        returnDate: rental.end_date,
        returnTime: rental.end_time,
        status: rental.status || (rental as any).rental_status,
        total_amount: amount.toString(),
        amount: amount,
        createdAt: rental.created_at,
        carId: rental.car_id,
        userId: rental.user_id,
      });
    });

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
    // Filter out EXECUTED requests - they should not appear in the requests list
    const requests = allRequests.filter(req => req.status !== 'EXECUTED');

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

    // Process borrow requests
    requests.forEach((request, index) => {
      const car = cars.find((c) => c.id.toString() === request.car_id);
      const profile = profiles.get(request.user_id);
      const email = profile?.email || request.user?.email || '';
      const phone = profile?.phone || '';
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : firstName || lastName
          ? `${firstName}${lastName}`
          : (email ? email.split('@')[0] : '')
          || `User ${request.user_id.slice(0, 8)}`;

      // Calculate estimated amount
      const startDate = new Date(request.start_date || new Date());
      const endDate = new Date(request.end_date || new Date());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const amount = car ? ((car as any)?.pricePerDay || car.price_per_day || 0) * days : 0;

      // Get age from request data, or use mock data if not available
      // Mock ages: 28, 35, 42, 29, 31, 26, 38, 33 (cycling through)
      const mockAges = [28, 35, 42, 29, 31, 26, 38, 33];
      const age = (request as any).age || (request as any).customer_age || mockAges[index % mockAges.length];

      // Get phone from request data or profile, or use mock data if not available
      // Mock phones: cycling through different numbers
      const mockPhones = [
        '+373 123 456 789',
        '+373 234 567 890',
        '+373 345 678 901',
        '+373 456 789 012',
        '+373 567 890 123',
        '+373 678 901 234',
        '+373 789 012 345',
        '+373 890 123 456'
      ];
      const finalPhone = phone || (request as any).phone || (request as any).customer_phone || mockPhones[index % mockPhones.length];

      // Get firstName/lastName from request data or profile, or use mock data if not available
      const mockFirstNames = ['Ion', 'Maria', 'Gheorghe', 'Elena', 'Nicolae', 'Ana', 'Alexandru', 'Natalia'];
      const mockLastNames = ['Popescu', 'Ionescu', 'Radu', 'Stan', 'Dumitru', 'Constantinescu', 'Munteanu', 'Nistor'];
      const finalFirstName = firstName || (request as any).first_name || (request as any).firstName || mockFirstNames[index % mockFirstNames.length];
      const finalLastName = lastName || (request as any).last_name || (request as any).lastName || mockLastNames[index % mockLastNames.length];

      // Parse options if they exist, or use mock data if not available
      let options = undefined;
      if ((request as any).options) {
        if (typeof (request as any).options === 'string') {
          try {
            options = JSON.parse((request as any).options);
          } catch (e) {
            options = undefined;
          }
        } else {
          options = (request as any).options;
        }
      }
      
      // If no options from database, use mock options for demonstration
      if (!options) {
        const mockOptionsList = [
          { unlimitedKm: true, speedLimitIncrease: true },
          { pickupAtAddress: true, returnAtAddress: true, personalDriver: true },
          { unlimitedKm: true, tireInsurance: true, childSeat: true },
          { priorityService: true, simCard: true, roadsideAssistance: true },
          { pickupAtAddress: true, unlimitedKm: true, personalDriver: true, tireInsurance: true },
        ];
        options = mockOptionsList[index % mockOptionsList.length];
      }

      orders.push({
        id: request.id,
        type: 'request',
        customerName: (finalFirstName && finalLastName) ? `${finalFirstName} ${finalLastName}` : userName,
        customerEmail: email || (request as any).email || (request as any).customer_email || '',
        customerPhone: finalPhone,
        customerFirstName: finalFirstName,
        customerLastName: finalLastName,
        customerAge: age,
        carName: (car as any)?.name || `${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
        avatar: (car as any)?.image || car?.image_url || '',
        pickupDate: request.start_date,
        pickupTime: request.start_time,
        returnDate: request.end_date,
        returnTime: request.end_time,
        status: request.status,
        total_amount: amount.toString(),
        amount: amount,
        createdAt: request.created_at,
        carId: request.car_id,
        userId: request.user_id,
        comment: (request as any).comment || (request as any).customer_comment || (request as any).customerComment || undefined,
        options: options,
      } as OrderDisplay & { comment?: string; options?: any });
    });

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
      .from('borrow_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: 'Request is not pending' };
    }

    // Update request status to APPROVED
    // The rental will be created automatically when pickup time arrives via processExecutedRequests
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
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
      .from('borrow_requests')
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
      .from('borrow_requests')
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

    const { error } = await supabase
      .from('borrow_requests')
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
  cars: Car[]
): Promise<{ success: boolean; rentalId?: string; error?: string }> {
  try {
    const car = cars.find(c => c.id.toString() === carId);
    if (!car) {
      return { success: false, error: 'Car not found' };
    }

    const { data: rental, error } = await supabase
      .from('rentals')
      .insert({
        user_id: userId,
        car_id: carId,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        price_per_day: (car as any)?.pricePerDay || car.price_per_day || 0,
        total_amount: totalAmount,
        rental_status: 'ACTIVE',
        payment_status: 'PENDING',
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
export async function processExecutedRequests(cars: Car[]): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    // Fetch all approved requests
    const { data: approvedRequests, error: fetchError } = await supabase
      .from('borrow_requests')
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
        // Update request status to EXECUTED
        const { error: updateError } = await supabase
          .from('borrow_requests')
          .update({ 
            status: 'EXECUTED', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Error updating request ${request.id} to EXECUTED:`, updateError);
          continue;
        }

        // Convert to order (rental) with ACTIVE status
        const car = cars.find(c => c.id.toString() === request.car_id);
        if (!car) {
          console.error(`Car not found for request ${request.id}`);
          continue;
        }

        // Calculate rental amount
        const startDate = new Date(request.start_date);
        const endDate = new Date(request.end_date);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const totalAmount = ((car as any)?.pricePerDay || car.price_per_day || 0) * days;

        // Check if rental already exists for this request
        const { data: existingRental } = await supabase
          .from('rentals')
          .select('id')
          .eq('request_id', request.id)
          .single();

        if (!existingRental) {
          // Create rental with ACTIVE status
          const { error: rentalError } = await supabase
            .from('rentals')
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
        } else {
          // Update existing rental to ACTIVE if it's not already
          const { error: updateRentalError } = await supabase
            .from('rentals')
            .update({ 
              rental_status: 'ACTIVE',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRental.id);

          if (updateRentalError) {
            console.error(`Error updating rental for request ${request.id}:`, updateRentalError);
            continue;
          }
        }

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
      .from('rentals')
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
          .from('rentals')
          .update({ 
            rental_status: 'COMPLETED',
            updated_at: new Date().toISOString() 
          })
          .eq('id', rental.id);

        if (updateError) {
          console.error(`Error updating rental ${rental.id} to COMPLETED:`, updateError);
          continue;
        }

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
 * Process all status transitions (executed requests and completed orders)
 */
export async function processStatusTransitions(cars: Car[]): Promise<{ success: boolean; executed: number; completed: number; error?: string }> {
  try {
    const [executedResult, completedResult] = await Promise.all([
      processExecutedRequests(cars),
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
    const { error } = await supabase
      .from('rentals')
      .update({ 
        rental_status: 'CANCELLED',
        updated_at: new Date().toISOString() 
      })
      .eq('id', rentalId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling rental order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Redo (undo cancel) a rental order - restore to ACTIVE status
 */
export async function redoRentalOrder(rentalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('rentals')
      .update({ 
        rental_status: 'ACTIVE',
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

