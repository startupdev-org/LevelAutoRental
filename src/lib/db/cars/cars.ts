import { supabase } from '../../supabase';
import { Car } from '../../../types';

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
 * Fetch main image + gallery images for a given car name.
 * Example carName: "Audi Q7"
 * Folder structure: cars/audi-q7/
 */
export async function fetchImagesByCarName(
    carName: string
): Promise<{ mainImage: string | null; photoGallery: string[] }> {
    try {
        // Convert "Mercedes C43" → "mercedes-c43"
        const folder = carName.toLowerCase().replace(/\s+/g, "-");

        const { data: files, error } = await supabase.storage
            .from("cars")
            .list(folder);

        if (error || !files) {
            console.error("Error listing files:", error);
            return { mainImage: null, photoGallery: [] };
        }

        // Keep only valid image files
        const imageFiles = files.filter(
            (file) =>
                file.name !== ".emptyFolderPlaceholder" &&
                /\.(jpg|jpeg|png)$/i.test(file.name)
        );

        if (imageFiles.length === 0) {
            return { mainImage: null, photoGallery: [] };
        }

        // Find main file
        const mainFile = imageFiles.find((f) => f.name.endsWith("-main.jpg")) || null;

        // Generate URLs helper
        const getUrl = (name: string) =>
            supabase.storage.from("cars").getPublicUrl(`${folder}/${name}`).data.publicUrl;

        // Build mainImage URL
        const mainImage = mainFile ? getUrl(mainFile.name) : null;

        // Sort gallery:
        // 1. main first
        // 2. numeric order after (c43-2, c43-3, ...)
        const sortedImages = imageFiles
            .filter((f) => f !== mainFile)
            .sort((a, b) => {
                // Extract number from "c43-2.jpg"
                const numA = parseInt(a.name.match(/-(\d+)\./)?.[1] || "0", 10);
                const numB = parseInt(b.name.match(/-(\d+)\./)?.[1] || "0", 10);
                return numA - numB;
            })
            .map((file) => getUrl(file.name));

        // Final gallery: main first, then sorted rest
        const photoGallery = [
            ...(mainImage ? [mainImage] : []),
            ...sortedImages,
        ];

        return { mainImage, photoGallery };
    } catch (err) {
        console.error("Unexpected error in fetchImagesByCarName:", err);
        return { mainImage: null, photoGallery: [] };
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

