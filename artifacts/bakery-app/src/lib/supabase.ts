import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    '[Basant Bakery] VITE_SUPABASE_URL is not set. ' +
    'Add it as an environment variable in the Replit Secrets panel.'
  );
}
if (!supabaseKey || supabaseKey === 'placeholder_key') {
  console.warn(
    '[Basant Bakery] VITE_SUPABASE_ANON_KEY is not set. ' +
    'Add it as a secret in the Replit Secrets panel.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder_key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
