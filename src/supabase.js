import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Les variables Supabase manquent ! Vérifie ton fichier .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)