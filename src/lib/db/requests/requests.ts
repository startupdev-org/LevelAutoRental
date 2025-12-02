import { BorrowRequest } from '../../orders';
import { supabase, supabaseAdmin } from '../../supabase';



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
