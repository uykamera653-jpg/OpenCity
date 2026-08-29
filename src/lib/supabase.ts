import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('OpenCity Supabase environment variables are not configured.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://uajwbvenibpuvjrrrabt.supabase.co',
  supabasePublishableKey ?? '',
);
