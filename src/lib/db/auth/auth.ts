import { User } from '../../../types';
import { supabase, supabaseAdmin } from '../../supabase';
import { getLoggedUser } from '../user/profile';


const redirectUrl = `${import.meta.env.VITE_BASE_URL}/update-password`;



/**
 * Create a new user
 * Method work with supabaseAdmin client !!!
 * 
 * ## Process
 * This function executes a PostgreSQL transaction via a Supabase RPC call.
 * The transaction guarantees that either **all operations succeed** or
 * **none are applied**.
 *
 * ### Steps performed in the database:
 * 1. Inserts a new row into the `Profiles` table using the provided user data.
 * 2. Searches the `BorrowRequest` table for existing records where:
 *    - `customer_email` matches the user's email (case-insensitive)
 *    - `user_id` is NULL (not yet linked to a profile)
 * 3. Updates all matching borrow requests by setting:
 *    - `user_id` to the newly created profile ID
 *    - `updated_at` to the current timestamp
 * 4. Returns the newly created profile.
 *
 * ## Why a database transaction?
 * Supabase JS does not support multi-query transactions directly.
 * By delegating the logic to PostgreSQL (via an RPC function),
 * we ensure **ACID compliance** and prevent partial data writes.
 *
 * ## Failure behavior
 * - If profile creation fails → no borrow requests are updated.
 * - If borrow request linking fails → profile creation is rolled back.
 *
 * @param user - User object containing profile information.
 * @returns An object containing either:
 * - `data`: The created `Profiles` row
 * - `error`: Supabase or unexpected error
 *
 */
export async function createUser(user: User) {
    try {
        const {
            id,
            first_name,
            last_name,
            email,
            phone_number,
            role
        } = user;

        const { data, error } = await supabaseAdmin.rpc(
            'create_user_and_link_borrow_requests',
            {
                p_id: id,
                p_first_name: first_name,
                p_last_name: last_name,
                p_email: email,
                p_phone_number: phone_number,
                p_role: role
            }
        );

        if (error) {
            console.error('Transaction failed:', error);
            return { data: null, error };
        }

        return { data, error: null };

    } catch (err) {
        console.error('Unexpected error while creating user:', err);
        return { data: null, error: err };
    }
}


/**
 * Change the current logged-in user's password
 */
export async function changeUserPassword(newPassword: string) {
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

    const { error: updateError } = await resetUserPassword(newPassword)

    if (updateError) return { succes: false, error: updateError.message }

    return { success: true }
}

export async function resetUserPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        return { success: false, error };
    }

    return { success: true };
}


export async function sendForgotPasswordEmail(email: string) {

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    })

    if (error) return { succes: false, error: error.message }

    return { success: true, data }
}

