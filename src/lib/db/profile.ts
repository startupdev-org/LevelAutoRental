import { User } from '../../types';
import { supabase } from '../supabase';

/**
 * update user profile info
 */
export interface UserProfileUpdate {
    id: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
}


export async function getProfile(): Promise<User | null> {
    try {
        // Get current logged-in user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error or no logged-in user', authError);
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

export async function updateProfile(user: UserProfileUpdate) {
    try {
        // Only include fields that are provided
        const updateData: Partial<UserProfileUpdate> = {};
        if (user.first_name) updateData.first_name = user.first_name;
        if (user.last_name) updateData.last_name = user.last_name;
        if (user.phone_number) updateData.phone_number = user.phone_number;

        const { data, error } = await supabase
            .from('Profiles')
            .update(updateData)
            .eq('id', user.id)
            .select();

        if (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }

        console.log('Updated user profile:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error updating user profile:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

