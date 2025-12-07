import { useState, useEffect } from 'react';
import { BorrowRequest, CarType, User } from '../../../../../types';
import { getLoggedUser } from '../../../../../lib/db/user/profile';
import { COUNTRY_CODES } from '../constants';

/**
 * Custom hook for managing form data and user initialization
 */
export const useFormData = (car: CarType | null, initialCarId?: string) => {
    const [initialLoading, setInitialLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [selectedCar, setSelectedCar] = useState<CarType | null>(car || null);
    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

    // Default form data
    const defaultFormData: BorrowRequest = {
        customer_name: '',
        customer_first_name: user?.first_name || '',
        customer_last_name: user?.last_name || '',
        customer_email: user?.email || '',
        customer_phone: user?.phone_number,
        car_id: initialCarId || '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        status: 'APPROVED',
        total_amount: 0,
        price_per_day: '',
        user_id: '',
        comment: '',
        options: null,
        requested_at: '',
        updated_at: '',
    };

    const [formData, setFormData] = useState<BorrowRequest>(defaultFormData);

    // Load user on mount
    useEffect(() => {
        console.log('[useFormData] Loading user data');
        const loadUser = async () => {
            setInitialLoading(true);
            try {
                const u = await getLoggedUser();
                setUser(u);
                console.log('[useFormData] User loaded:', u?.id);
            } catch (error) {
                console.error('[useFormData] Error loading user:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        loadUser();
    }, []);

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            console.log('[useFormData] Updating form data with user info');
            setFormData((prev) => ({
                ...prev,
                customer_name: `${user.first_name || ''} ${user.last_name || ''}`,
                customer_first_name: user.first_name || '',
                customer_last_name: user.last_name || '',
                customer_email: user.email || '',
                customer_phone: user.phone_number || '',
                user_id: user.id,
            }));
        }
    }, [user]);

    // Update selected car when car prop changes
    useEffect(() => {
        if (car) {
            console.log('[useFormData] Updating selected car:', car.id);
            setSelectedCar(car);
            setFormData((prev) => ({
                ...prev,
                car_id: car.id.toString(),
            }));
        }
    }, [car]);

    const handleSetSelectedCar = (selectedCar: CarType | null) => {
        console.log('[useFormData] Car selected:', selectedCar?.id);
        setSelectedCar(selectedCar);
        setFormData((prev) => ({
            ...prev,
            car_id: selectedCar ? selectedCar.id.toString() : '',
        }));
    };

    return {
        initialLoading,
        user,
        selectedCar,
        setSelectedCar: handleSetSelectedCar,
        selectedCountryCode,
        setSelectedCountryCode,
        showCountryCodeDropdown,
        setShowCountryCodeDropdown,
        formData,
        setFormData,
    };
};