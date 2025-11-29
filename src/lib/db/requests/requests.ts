import { BorrowRequest } from '../../orders';
import { supabase } from '../../supabase';


/**
 * BUG:
 * When attempting to save a borrow request from the frontend, the operation fails with the following error:
 * 
 * Could not find the 'age' column of 'BorrowRequest' in the schema cache
 * code: 'PGRST204'
 * 
 * in the supabase table there is not any age column in the borrow request 
 * 
 * things to do, modify the thing that is sent to the borrow request table
 */

/**
 * 
 * @param borrowRequest 
 * @returns 
 */
export async function saveBorrowRequest(borrowRequest: BorrowRequest) {
    try {
        const { data, error } = await supabase
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
