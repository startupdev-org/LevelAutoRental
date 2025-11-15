import { supabase } from '../supabase';
import { Car } from '../../types';

/**
 * Fetch all cars from Supabase
 */
export async function fetchCars(): Promise<Car[]> {
    // console.log('fetching all cars from database');
    try {
        const { data, error } = await supabase
            .from("Cars")
            .select("*");


        if (error) {
            console.error('Error fetching cars:', error);
            return [];
        }

        console.log('cars fetched: ', data)

        // data can be null, so default to empty array
        return data ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchCars:', err);
        return [];
    }
}

export async function fetchImage() {
    console.log('fetching a image from database');
    try {
        const { data } = await supabase
            .storage
            .from("cars")
            .getPublicUrl('cls-1.jpg')

        console.log('image data: ', data)

        // data can be null, so default to empty array
        return data.publicUrl;
    } catch (err) {
        console.error('Unexpected error in fetchImage:', err);
        return [];
    }
}

export async function fetchImages() {
    // console.log('fetching all images from database');
    try {
        const { data, error } = await supabase.storage.from("cars").list("", {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
        })
        // console.log("data:", data, "error:", error);


        if (!data) return [];

        // console.log('all images data: ', data)

        const urls = data.map((file) => {
            return supabase.storage
                .from("cars")
                .getPublicUrl(file.name).data.publicUrl;
        });

        // console.log('urls: ', urls)


        // data can be null, so default to empty array
        return data ?? [];
    } catch (err) {
        console.error('Unexpected error in fetchImages:', err);
        return [];
    }
}

/**
 * Fetch the main images of the cars 
 * @returns 
 */
export async function fetchMainImages() {
    try {
        // List all folders in the "cars" bucket
        const { data: folders, error } = await supabase.storage.from("cars").list();
        if (error || !folders) {
            console.error('Error listing folders:', error);
            return [];
        }

        // console.log('folders: ', folders);

        // For each folder, list files and get the one ending with "-main.jpg"
        const mainUrls = await Promise.all(
            folders.map(async folder => {
                const { data: files, error } = await supabase.storage.from("cars").list(folder.name);
                if (error || !files) return null;

                const mainFile = files.find(file => file.name.endsWith('-main.jpg'));
                if (!mainFile) return null;

                const { data } = supabase.storage.from("cars").getPublicUrl(`${folder.name}/${mainFile.name}`);
                return data?.publicUrl || null;
            })
        );

        // console.log('mainUrls: ', mainUrls)

        return mainUrls.filter(Boolean); // remove nulls
    } catch (err) {
        console.error('Unexpected error in fetchMainImages:', err);
        return [];
    }
}

