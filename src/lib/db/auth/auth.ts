import { errorBarReducer } from 'recharts/types/state/errorBarSlice';
import { User } from '../../../types';
import { supabase, supabaseAdmin } from '../../supabase';
import { getLoggedUser } from '../user/profile';

/**
 * Create a new user
 * Method work with supabaseAdmin client !!!
 */
export async function createUser(user: User) {
    console.log('creating a user after sign up');
    try {

        const { id, first_name, last_name, email, phone_number, role } = user;

        const { data, error } = await supabaseAdmin
            .from('Profiles')
            .insert({ id, first_name, last_name, email, phone_number, role })
            .select();


        console.log('created user is: ', data)

        console.log('error: ', error)

        return { data, error };


    } catch (err) {
        console.error('Unexpected error in while creating a new user:', err);

        return {
            data: null,
            error: err
        };
    }
}

/**
 * Change the current logged-in user's password
 */
export async function changeUserPassword(newPassword: string) {
    console.log("chaning user's password ")
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        console.error('Error updating password:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updatePassword(currentPassword: string, newPassword: string) {
    const user = await getLoggedUser();

    const email = user && user.email && user.email !== null ? user?.email : '';

    const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
    })

    if (loginError) return { succes: false, error: loginError.message }

    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (updateError) return { succes: false, error: updateError.message }

    return { success: true }
}

