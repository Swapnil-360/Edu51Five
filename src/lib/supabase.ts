import { createClient } from '@supabase/supabase-js';

// Prefer build-time Vite envs, but allow runtime fallbacks (useful for advanced deploys)
const _envUrl = import.meta.env.VITE_SUPABASE_URL ?? (typeof window !== 'undefined' ? (window as any).__SUPABASE_URL : undefined);
const _envKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? (typeof window !== 'undefined' ? (window as any).__SUPABASE_ANON_KEY : undefined);

// Normalize values and strip trailing slashes from URL
const supabaseUrlRaw = typeof _envUrl === 'string' ? _envUrl.trim() : String(_envUrl || '');
const supabaseAnonKeyRaw = typeof _envKey === 'string' ? _envKey.trim() : String(_envKey || '');
const supabaseUrl = supabaseUrlRaw.replace(/\/+$/g, '');
const supabaseAnonKey = supabaseAnonKeyRaw;

// Basic validation to avoid creating a client with placeholder/invalid values that trigger 400s
function looksLikeValidUrl(url: string) {
  return /^https?:\/\/.+/.test(url) && !url.includes('your-supabase');
}

function looksLikeAnonKey(key: string) {
  if (!key) return false;
  // anon keys are typically long (JWT-like) strings — use a conservative length check
  return key.length > 30 && !key.includes('your-supabase');
}

const isSupabaseConfigured = Boolean(
  looksLikeValidUrl(supabaseUrl) && looksLikeAnonKey(supabaseAnonKey)
);
export const supabaseConfigured = isSupabaseConfigured;

// Provide a safe no-op Supabase mock when env is missing so UI can still render and tests can run
function createSupabaseMock() {
  const makeErrorResponse = () => ({ 
    data: null, 
    error: { message: 'Supabase not configured', code: 'MOCK_ERROR' } 
  });
  const makeResponse = (extra: any = {}) => ({ data: [], error: null, ...extra });

  const chainAfterSelect = {
    in: () => chainAfterSelect,
    eq: () => chainAfterSelect,
    order: () => Promise.resolve(makeErrorResponse()),
    limit: () => Promise.resolve(makeErrorResponse()),
  } as any;

  const queryStub = () => ({
    select: (_cols?: any, options?: any) => {
      if (options?.head) return Promise.resolve({ count: 0, error: null });
      return chainAfterSelect;
    },
    order: () => Promise.resolve(makeErrorResponse()),
    eq: () => chainAfterSelect,
    in: () => chainAfterSelect,
    insert: () => Promise.resolve(makeResponse(null)),
    upsert: () => Promise.resolve(makeResponse(null)),
    delete: () => Promise.resolve(makeResponse(null)),
    limit: () => Promise.resolve(makeErrorResponse()),
  });

  const storage = {
    from: () => ({
      upload: async () => ({ data: { path: '' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => ({ data: null, error: null })
    })
  } as any;

  const auth = {
    signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured', code: 'MOCK_AUTH' } }),
  } as any;

  // Count queries: .select('*', { count: 'exact', head: true })
  return {
    from: (_table: string) => queryStub(),
    storage,
    auth,
  } as any;
}

// Suppress verbose console logs
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Suppress Supabase connection warnings
  console.error = function(...args: any[]) {
    if (args[0]?.toString?.().includes('Could not establish connection') || 
        args[0]?.toString?.().includes('Receiving end does not exist')) {
      return; // Suppress noisy Supabase errors
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args: any[]) {
    if (args[0]?.toString?.().includes('Supabase not configured')) {
      return; // Suppress Supabase not configured warning
    }
    originalWarn.apply(console, args);
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      global: {
        fetch: (...args: any[]) => {
          return fetch(...args).catch((error) => {
            // Suppress connection errors silently
            if (error?.message?.includes('Could not establish connection')) {
              return new Response(JSON.stringify({ error: 'offline' }), { status: 0 });
            }
            throw error;
          });
        },
      },
    })
  : (() => {
      if (isSupabaseConfigured === false) {
        console.info('ℹ️ Supabase not fully configured. Using offline mode.');
      }
      return createSupabaseMock();
    })();