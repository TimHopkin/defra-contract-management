import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }
  
  // Check for undefined string values
  if (supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    return false
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl)
    return true
  } catch {
    return false
  }
}

// Only create client if properly configured
let supabaseClient = null

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseClient
}

// Export the client getter as supabase for backward compatibility
export const supabase = getSupabaseClient()