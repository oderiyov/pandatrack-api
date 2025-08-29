// Створити файл: apps/web/src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Type definitions for our database
export interface Shipment {
  id: string
  tracking_number: string
  carrier_id: string
  status: 'pending' | 'in_transit' | 'delivered' | 'exception' | 'expired'
  created_at: string
  updated_at: string
  user_id?: string
  encrypted_data: string
}

export interface TrackingEvent {
  id: string
  shipment_id: string
  status: string
  description: string
  location?: string
  timestamp: string
  created_at: string
}

export interface Carrier {
  id: string
  code: string
  name: string
  name_ua: string
  is_active: boolean
}