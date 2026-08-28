import { createClient } from '@supabase/supabase-js';

/** Avoid a second GoTrueClient fighting the anon client for the same storage key. */
const memoryAuthStorage = {
    getItem: () => null as string | null,
    setItem: () => {},
    removeItem: () => {},
};

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing env.VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin client: isolated auth storage so it does not share sb-*-auth-token with `supabase`
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: memoryAuthStorage,
  },
});

// Database types (you can generate these later with Supabase CLI)
export type Database = {
  public: {
    Tables: {
      // Add your table types here when you create them
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
  };
};

