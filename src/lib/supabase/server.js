import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aqunpkwwvslnmuqvotyl.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdW5wa3d3dnNsbm11cXZvdHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDAyODQsImV4cCI6MjA2MTAxNjI4NH0.FgbKG2DyKL7Ob6fIfwaC43_jAphP7YG2D61IgIIVHpo',
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
