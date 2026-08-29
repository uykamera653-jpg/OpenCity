import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uajwbvenibpuvjrrrabt.supabase.co';

// Supabase publishable keys are intended for client-side use.
// Keep the environment variable as the preferred source, with the project key
// as a fallback so hosted OnSpace builds work even when env injection is absent.
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ltaNA7nnVozoSCOcZIjg';

export const isSupabaseConfigured = Boolean(supabasePublishableKey);

export const supabase: SupabaseClient | null = supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const SUPABASE_URL = supabaseUrl;
