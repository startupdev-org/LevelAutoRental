// Simple test script to fetch CLS image from Supabase
// Run with: node test-cls-image.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase credentials here
const supabaseUrl = 'your_supabase_url';
const supabaseKey = 'your_supabase_anon_key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize car name to match folder structure
function normalizeCarNameToFolder(carName) {
    return carName
        .toLowerCase()
        .replace(/mercedes-amg/gi, "mercedes")
        .replace(/amg/gi, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .split(/\s+/)
        .join("-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function fetchCLSImage() {
    try {
        console.log('🔍 Fetching CLS image from Supabase...');

        // Normalize car name to match folder structure
        let folder = normalizeCarNameToFolder("Mercedes CLS");
        console.log('📁 Looking in folder:', folder);

        let { data: files, error } = await supabase.storage
            .from("cars")
            .list(folder);

        console.log('📋 Files found:', files?.length || 0);

        if (error || !files) {
            console.error('❌ Error:', error);
            return null;
        }

        // Keep only valid image files
        const imageFiles = files.filter(
            (file) =>
                file.name !== ".emptyFolderPlaceholder" &&
                /\.(jpg|jpeg|png)$/i.test(file.name)
        );

        console.log('🖼️ Image files:', imageFiles.map(f => f.name));

        if (imageFiles.length === 0) {
            console.warn('⚠️ No image files found');
            return null;
        }

        // Sort by name and get the first one as main image
        imageFiles.sort((a, b) => a.name.localeCompare(b.name));
        const mainImageFile = imageFiles[0];

        // Generate public URL
        const { data: urlData } = supabase.storage
            .from("cars")
            .getPublicUrl(`${folder}/${mainImageFile.name}`);

        console.log('✅ CLS Image URL:', urlData.publicUrl);
        return urlData.publicUrl;

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return null;
    }
}

// Run the test
fetchCLSImage();
