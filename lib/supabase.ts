import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for browser/client-side usage
 * Uses the anonymous key which respects Row Level Security (RLS) policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Create a Supabase client with custom options
 * Useful for SSR or when you need specific configurations
 */
export function createSupabaseClient(options?: {
  supabaseUrl?: string
  supabaseKey?: string
}) {
  return createClient(
    options?.supabaseUrl || supabaseUrl,
    options?.supabaseKey || supabaseAnonKey
  )
}
