import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqunpkwwvslnmuqvotyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdW5wa3d3dnNsbm11cXZvdHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDAyODQsImV4cCI6MjA2MTAxNjI4NH0.FgbKG2DyKL7Ob6fIfwaC43_jAphP7YG2D61IgIIVHpo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
