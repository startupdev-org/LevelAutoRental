import { User } from '../../../types';
import { supabase } from '../../supabase';

/**
 * update user profile info
 */
export interface UserProfileUpdate {
    id: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
}

export async function getLoggedUser(): Promise<User> {
    const {
        data: { user: authUser },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
        console.error('Auth error or no logged-in user', authError);
        throw authError;
    }

    const { data: profile, error } = await supabase
        .from('Profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

    if (error) throw error;

    const email = profile?.email ?? authUser.email ?? '';

    // App identity uses Auth id. BorrowRequest.user_id still requires a Profiles row (FK).
    if (!profile) {
        return {
            id: authUser.id,
            email,
            role: null,
        } as User;
    }

    return {
        ...profile,
        id: authUser.id,
        email: profile.email ?? authUser.email ?? email,
    } as User;
}

/** Profiles.id for the current session, or null if no row (safe for BorrowRequest.user_id FK). */
export async function getProfileIdForBorrowFkey(): Promise<string | null> {
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.id) return null;

    const { data, error } = await supabase
        .from('Profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

    if (error || !data?.id) return null;
    return data.id;
}

export async function getProfile(): Promise<User | null> {
    try {
        // Get current logged-in user
        const user = await getLoggedUser();

        if (!user) {
            console.error("No logged-in user found");
            return null;
        }

        // Fetch the profile
        const { data, error } = await supabase
            .from('Profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        return null;
    }
}


export async function updateProfile(user: Partial<User>) {
    try {
        // Only include fields that are provided
        const updateData: Partial<User> = {};
        if (user.first_name) updateData.first_name = user.first_name;
        if (user.last_name) updateData.last_name = user.last_name;
        if (user.phone_number) updateData.phone_number = user.phone_number;

        // 

        if (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }


        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error updating user profile:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

/**
 * Fetch multiple user profiles by their IDs
 */
export async function fetchUserProfiles(userIds: string[]): Promise<User[]> {
    try {
        if (userIds.length === 0) return [];

        const { data, error } = await supabase
            .from('Profiles')
            .select('*')
            .in('id', userIds);

        if (error) {
            console.error('Error fetching user profiles:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching user profiles:', err);
        return [];
    }
}

export async function fetchUserProfileByEmail(userEmail: string): Promise<User> {
    try {
        const { data, error } = await supabase
            .from('Profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (error) {
            console.error('Error while fetching user\s profile by email:', error);
            throw Error(error.message)
        }

        return data;
    } catch (err) {
        console.error('Unexpected error when fetching user\'s profile by email:', err);
        throw Error('Unexpected error when fetching user\'s profile by email')
    }
}

