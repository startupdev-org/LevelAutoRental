import { supabase } from '../../supabase';
import { Car } from '../../../types';

/**
 * Fetch car by id
 */
export async function fetchCarById(carId: string): Promise<Car | null> {
    console.log('fetching car by id from database');
    try {
        const { data, error } = await supabase
            .from("Cars")
            .select("*")
            .eq('id', carId)
            .single();


        if (error) {
            console.error('Error fetching cars:', error);
            return null;
        }

        console.log('car fetched: ', data)

        // data can be null, so default to empty array
        return data ?? null;
    } catch (err) {
        console.error('Unexpected error while fetching a car:', err);
        return null;
    }
}


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
 * Normalize car name to match bucket folder structure
 * Handles cases like:
 * - "Mercedes-AMG C43" → "mercedes-c43"
 * - "Mercedes AMG C43" → "mercedes-c43"
 * - "BMW X4" → "bmw-x4"
 * - "Mercedes CLS" → "mercedes-cls"
 * - "Mercedes CLS 350" → "mercedes-cls-350"
 */
function normalizeCarNameToFolder(carName: string): string {
    if (!carName) return "";
    
    // Remove common prefixes and normalize
    let normalized = carName
        .toLowerCase()
        .trim()
        .replace(/\s*-\s*/g, "-") // Normalize hyphens with spaces
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/mercedes-amg/gi, "mercedes") // "Mercedes-AMG" → "mercedes"
        .replace(/mercedes\s+amg/gi, "mercedes") // "Mercedes AMG" → "mercedes"
        .replace(/amg-/gi, "") // Remove "amg-" prefix if it appears
        .replace(/-amg/gi, "") // Remove "-amg" suffix if it appears
        .replace(/[^a-z0-9-]/g, "") // Remove special characters
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
    
    return normalized;
}

/**
 * Fetch main image + gallery images for a given car name.
 * Example carName: "Audi Q7"
 * Folder structure: cars/audi-q7/
 * File naming: q7-main.jpg, q7-2.jpg, q7-3.jpg, etc.
 */
export async function fetchImagesByCarName(
    carName: string
): Promise<{ mainImage: string | null; photoGallery: string[] }> {
    try {
        // Normalize car name to match folder structure
        // "Mercedes-AMG C43" → "mercedes-c43", "BMW X4" → "bmw-x4"
        let folder = normalizeCarNameToFolder(carName);

        console.log(`[fetchImagesByCarName] Car name: "${carName}" → Folder: "${folder}"`);

        let { data: files, error } = await supabase.storage
            .from("cars")
            .list(folder);

        // If folder not found, try alternative variations
        if ((error || !files || files.length === 0) && carName) {
            // Try with just make and model separated differently
            const parts = carName.toLowerCase().split(/\s+/);
            if (parts.length >= 2) {
                const make = parts[0].replace(/mercedes-amg/gi, "mercedes").replace(/amg/gi, "");
                const model = parts.slice(1).join("-");
                const altFolder = `${make}-${model}`.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
                
                if (altFolder !== folder) {
                    console.log(`[fetchImagesByCarName] Trying alternative folder: "${altFolder}"`);
                    const altResult = await supabase.storage.from("cars").list(altFolder);
                    if (!altResult.error && altResult.data && altResult.data.length > 0) {
                        folder = altFolder;
                        files = altResult.data;
                        error = null;
                        console.log(`[fetchImagesByCarName] Found files in alternative folder: "${altFolder}"`);
                    }
                }
            }
        }

        if (error || !files) {
            console.error(`[fetchImagesByCarName] Error listing files in folder "${folder}":`, error);
            return { mainImage: null, photoGallery: [] };
        }

        console.log(`[fetchImagesByCarName] Found ${files.length} files in folder "${folder}"`);

        // Keep only valid image files
        const imageFiles = files.filter(
            (file) =>
                file.name !== ".emptyFolderPlaceholder" &&
                /\.(jpg|jpeg|png)$/i.test(file.name)
        );

        console.log(`[fetchImagesByCarName] Filtered to ${imageFiles.length} image files`);

        if (imageFiles.length === 0) {
            console.warn(`[fetchImagesByCarName] No image files found in folder "${folder}"`);
            return { mainImage: null, photoGallery: [] };
        }

        // Extract model part from folder name (e.g., "bmw-x4" → "x4", "mercedes-c43" → "c43")
        // The folder name is typically "{make}-{model}", so we take everything after the first hyphen
        const folderParts = folder.split("-");
        const modelPart = folderParts.slice(1).join("-"); // Handles cases like "mercedes-cls-350" → "cls-350"
        
        console.log(`[fetchImagesByCarName] Model part: "${modelPart}", Available files:`, imageFiles.map(f => f.name));

        // Find main file (e.g., "x4-main.jpg", "c43-main.jpg", "ghibli-main.jpg")
        // Try multiple patterns to be more flexible
        const mainFile = imageFiles.find((f) => {
            const baseName = f.name.toLowerCase().replace(/\.(jpg|jpeg|png)$/i, "");
            // Try exact match first: "ghibli-main"
            if (baseName === `${modelPart}-main`) return true;
            // Try without hyphen: "ghiblimain"
            if (baseName === `${modelPart}main`) return true;
            // Try ending with -main: any file ending with "-main"
            if (baseName.endsWith("-main")) return true;
            // Try just the model part: "ghibli" (if it's the only file with that name)
            if (baseName === modelPart && imageFiles.filter(f2 => {
                const bn2 = f2.name.toLowerCase().replace(/\.(jpg|jpeg|png)$/i, "");
                return bn2 === modelPart;
            }).length === 1) return true;
            return false;
        }) || null;

        if (!mainFile) {
            console.warn(`[fetchImagesByCarName] No main file found for model "${modelPart}" in folder "${folder}". Available files:`, imageFiles.map(f => f.name));
            // Fallback: use the first image file if no main file is found
            if (imageFiles.length > 0) {
                console.log(`[fetchImagesByCarName] Using first available file as fallback: "${imageFiles[0].name}"`);
            }
        } else {
            console.log(`[fetchImagesByCarName] Found main file: "${mainFile.name}" for model "${modelPart}"`);
        }

        // Generate URLs helper
        const getUrl = (name: string) =>
            supabase.storage.from("cars").getPublicUrl(`${folder}/${name}`).data.publicUrl;

        // Build mainImage URL - use main file if found, otherwise use first image as fallback
        const mainImage = mainFile ? getUrl(mainFile.name) : (imageFiles.length > 0 ? getUrl(imageFiles[0].name) : null);
        
        if (mainImage) {
            console.log(`[fetchImagesByCarName] Main image URL: ${mainImage}`);
        }

        // Sort gallery images:
        // Filter out main file (or first file if used as fallback), then sort by number (e.g., x4-2.jpg, x4-3.jpg, etc.)
        const fileToExclude = mainFile || (imageFiles.length > 0 ? imageFiles[0] : null);
        const sortedImages = imageFiles
            .filter((f) => f !== fileToExclude)
            .sort((a, b) => {
                // Extract number from "x4-2.jpg" or "c43-3.jpg"
                // Pattern: {model}-{number}.jpg
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

export async function fetchCarWithImagesById(
    carId: string
): Promise<Car> {
    const car = await fetchCarById(carId);

    if (!car) {
        throw new Error(`Car with id ${carId} not found`);
    }

    const carName = `${car.make} ${car.model}`;
    const { mainImage, photoGallery } = await fetchImagesByCarName(carName);

    car.image_url = mainImage;
    car.photo_gallery = photoGallery;

    return car;
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

        // Filter out non-folder items and the "contracts" folder
        const carFolders = folders.filter(folder => 
            folder.name !== "contracts" && 
            !folder.name.includes('.') // Exclude files at root level
        );

        // For each folder, list files and get the one matching "{model}-main.jpg"
        const mainUrls = await Promise.all(
            carFolders.map(async folder => {
                const { data: files, error } = await supabase.storage.from("cars").list(folder.name);
                if (error || !files) return null;

                // Extract model part from folder name (e.g., "bmw-x4" → "x4")
                const folderParts = folder.name.split("-");
                const modelPart = folderParts.slice(1).join("-");

                // Find main file matching "{model}-main.jpg" pattern
                const mainFile = files.find(file => {
                    const baseName = file.name.toLowerCase().replace(/\.(jpg|jpeg|png)$/i, "");
                    return baseName === `${modelPart}-main` || baseName === `${modelPart}main`;
                });

                if (!mainFile) return null;

                const { data } = supabase.storage.from("cars").getPublicUrl(`${folder.name}/${mainFile.name}`);
                return data?.publicUrl || null;
            })
        );

        return mainUrls.filter(Boolean); // remove nulls
    } catch (err) {
        console.error('Unexpected error in fetchMainImages:', err);
        return [];
    }
}

