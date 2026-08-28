// Re-export from SSR client so all components use the same cookie-based client
// This prevents "Multiple GoTrueClient instances" warnings and auth conflicts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pattern - reuse the same instance to avoid duplicate clients
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
};

// Named export for backward compatibility with all existing imports
export const supabase = getSupabaseClient();
