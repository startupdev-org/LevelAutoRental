import { User } from '../../../types';
import { supabase, supabaseAdmin } from '../../supabase';
import { getLoggedUser } from '../profile';

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


    } catch (err) {
        console.error('Unexpected error in while creating a new user:', err);
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

