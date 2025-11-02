import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase') &&
  !supabaseAnonKey.includes('your-supabase')
);

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

  // Count queries: .select('*', { count: 'exact', head: true })
  return {
    from: (_table: string) => queryStub(),
    storage,
  } as any;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : (() => {
      console.warn('⚠️ Supabase not configured. Using no-op mock. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real backend.');
      return createSupabaseMock();
    })();