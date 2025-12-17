import { fetchUserProfileByEmail } from "../../lib/db/user/profile";
import { User } from "../../types";

export const getCustomerName = async (email: string): Promise<string> => {
    const user = await fetchUserProfileByEmail(email);
    return `${user.first_name} ${user.last_name}`;
};


export function getCustomerNameSync(user: User | null): string {
    if (!user) return 'Unknown Customer';
    return `${user.first_name} ${user.last_name}`;
}
