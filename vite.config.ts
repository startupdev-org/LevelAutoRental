import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", // Root path
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  build: {
    // Enable minification (esbuild is faster than terser)
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Conservative chunking to avoid React scheduler race conditions
          // Based on: https://github.com/vitejs/vite/issues/12209
          
          // IMPORTANT: Check React dependencies FIRST before other chunks
          // This ensures React loads before any app code that needs it
          if (id.includes('node_modules')) {
            // Put React and ALL potential React-dependent libraries together
            // This prevents chunks from trying to patch React before it's ready
            if (id.includes('react') || 
                id.includes('framer-motion') ||
                id.includes('@mui') ||
                id.includes('@emotion') ||
                id.includes('styled-components') ||
                id.includes('react-router') ||
                id.includes('react-i18next') ||
                id.includes('react-query') ||
                id.includes('react-icons') ||
                id.includes('react-slick') ||
                id.includes('react-phone-input') ||
                id.includes('i18next') || // i18next core also needs React
                id.includes('@radix-ui') || // Radix UI depends on React
                id.includes('sonner') || // Toast library depends on React
                id.includes('zustand') || // State management might use React
                id.includes('@tremor')) { // Tremor depends on React
              return 'react-vendor';
            }
            // Only split out clearly independent, large libraries
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Everything else goes with React to be safe
            return 'react-vendor';
          }
          
          // App code chunks - these will load after vendor chunks
          // IMPORTANT: Don't split admin/dashboard - they need React immediately
          // Lazy loading already handles code splitting, manual chunks cause race conditions
          // if (id.includes('/pages/admin/')) {
          //   return 'admin';
          // }
          // if (id.includes('/pages/dashboard/')) {
          //   return 'dashboard';
          // }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
});
