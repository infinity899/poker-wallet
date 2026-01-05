import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

// Create a typed Supabase client
export function useTypedSupabaseClient(): SupabaseClient<Database> {
  return useSupabaseClient<Database>();
}
