interface CachedImages {
  mainImage: string | null;
  photoGallery: string[];
  timestamp: number;
}

interface ImageCache {
  [carName: string]: CachedImages;
}

const CACHE_KEY = 'level-auto-rental-images-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const imageCache = {
  get: (carName: string): CachedImages | null => {
    try {
      const cache: ImageCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const cached = cache[carName];

      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        delete cache[carName];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached;
    } catch (error) {
      console.warn('Failed to read image cache:', error);
      return null;
    }
  },

  set: (carName: string, data: { mainImage: string | null; photoGallery: string[] }) => {
    try {
      const cache: ImageCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[carName] = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache images:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  },

  getCacheSize: (): number => {
    try {
      const cache = localStorage.getItem(CACHE_KEY) || '{}';
      return new Blob([cache]).size;
    } catch {
      return 0;
    }
  },
};
