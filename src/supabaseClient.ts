// Declare interface for import.meta.env support in standard typescript compilers
interface ImportMeta {
  readonly env: {
    readonly [key: string]: string | undefined;
  };
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isDbConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isDbConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!isDbConfigured) {
  console.warn(
    'Supabase keys are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable the database integration.'
  );
}
