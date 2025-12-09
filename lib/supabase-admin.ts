import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Supabase Admin client for server-side usage only
 * Uses the service role key which bypasses Row Level Security (RLS)
 *
 * WARNING: Never expose this client to the browser!
 * Only use in:
 * - API routes
 * - Server components
 * - Server actions
 * - Background jobs
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
