import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://xdrfsrluqxddgydohqlm.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcmZzcmx1cXhkZGd5ZG9ocWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ3NjMsImV4cCI6MjA3Njc2MDc2M30.ijZNIK8DDauNkdDj12oSjIKWKiIvZZmEqu_2gKeVKVw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string
          name: string
          npi: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          npi: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          npi?: string
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          mrn: string
          provider_id: string | null
          date_of_birth: string | null
          sex: string | null
          weight_kg: number | null
          allergies: string | null
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          mrn: string
          provider_id?: string | null
          date_of_birth?: string | null
          sex?: string | null
          weight_kg?: number | null
          allergies?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          mrn?: string
          provider_id?: string | null
          date_of_birth?: string | null
          sex?: string | null
          weight_kg?: number | null
          allergies?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          patient_id: string
          medication_name: string
          primary_diagnosis: string
          additional_diagnoses: string[]
          medication_history: string[]
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          medication_name: string
          primary_diagnosis: string
          additional_diagnoses?: string[]
          medication_history?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          medication_name?: string
          primary_diagnosis?: string
          additional_diagnoses?: string[]
          medication_history?: string[]
          created_at?: string
        }
      }
      care_plans: {
        Row: {
          id: string
          order_id: string
          plan_text: string
          generated_by: string
          generated_at: string
          version: number
          is_final: boolean
        }
        Insert: {
          id?: string
          order_id: string
          plan_text: string
          generated_by?: string
          generated_at?: string
          version?: number
          is_final?: boolean
        }
        Update: {
          id?: string
          order_id?: string
          plan_text?: string
          generated_by?: string
          generated_at?: string
          version?: number
          is_final?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          event_type: string
          entity_id: string | null
          entity_type: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          entity_id?: string | null
          entity_type?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          entity_id?: string | null
          entity_type?: string | null
          description?: string | null
          created_at?: string
        }
      }
    }
  }
}
