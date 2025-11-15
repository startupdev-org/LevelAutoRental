import { User } from '../../types';
import { supabase } from '../supabase';

/**
 * update user profile info
 */
export async function updateProfile(user: User) {
    console.log('creating a user after sign up');
    try {

        const { id, first_name, last_name, email, phone_number, role } = user;

        const { data, error } = await supabase
            .from('Profiles')
            .insert({ id, first_name, last_name, email, phone_number, role })
            .select();


        console.log('created user is: ', data)

        console.log('error: ', error)


    } catch (err) {
        console.error('Unexpected error in while creating a new user:', err);
    }
}

