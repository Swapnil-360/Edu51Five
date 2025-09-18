import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-ref.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here') {
  console.error('❌ Supabase configuration error:');
  console.error('Please configure your Supabase credentials in the .env file:');
  console.error('1. Copy VITE_SUPABASE_URL from your Supabase project dashboard');
  console.error('2. Copy VITE_SUPABASE_ANON_KEY from your Supabase project dashboard');
  console.error('3. Replace the placeholder values in .env file');
  console.error('4. Restart your development server');
  
  // Throw error to prevent app from trying to connect with invalid credentials
  throw new Error('Supabase environment variables not properly configured. Check console for setup instructions.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);