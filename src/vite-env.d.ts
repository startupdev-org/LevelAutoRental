/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly VITE_EXCHANGE_RATE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

