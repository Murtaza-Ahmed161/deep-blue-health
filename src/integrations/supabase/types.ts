export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_screening_results: {
        Row: {
          anomaly_detected: boolean
          confidence_level: number
          created_at: string
          explanation: string
          id: string
          recommendations: string[] | null
          severity: string
          user_id: string
          vitals_id: string | null
        }
        Insert: {
          anomaly_detected?: boolean
          confidence_level: number
          created_at?: string
          explanation: string
          id?: string
          recommendations?: string[] | null
          severity: string
          user_id: string
          vitals_id?: string | null
        }
        Update: {
          anomaly_detected?: boolean
          confidence_level?: number
          created_at?: string
          explanation?: string
          id?: string
          recommendations?: string[] | null
          severity?: string
          user_id?: string
          vitals_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_screening_results_vitals_id_fkey"
            columns: ["vitals_id"]
            isOneToOne: false
            referencedRelation: "vitals"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Relationships: []
      }
      consent_audit: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          granted: boolean
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          consultation_type: string
          created_at: string
          doctor_id: string | null
          doctor_notes: string | null
          id: string
          notes: string | null
          patient_id: string
          patient_notes: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consultation_type: string
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consultation_type?: string
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          device_info: Json | null
          id: string
          page_url: string | null
          priority: string | null
          screenshot_url: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          device_info?: Json | null
          id?: string
          page_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          device_info?: Json | null
          id?: string
          page_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_reports: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          created_at: string
          doctor_notes: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          ocr_text: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          upload_date: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          doctor_notes?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          ocr_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          doctor_notes?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          ocr_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          critical_alerts: boolean
          doctor_messages: boolean
          email_enabled: boolean
          id: string
          new_reports: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
          vitals_warnings: boolean
        }
        Insert: {
          created_at?: string
          critical_alerts?: boolean
          doctor_messages?: boolean
          email_enabled?: boolean
          id?: string
          new_reports?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
          vitals_warnings?: boolean
        }
        Update: {
          created_at?: string
          critical_alerts?: boolean
          doctor_messages?: boolean
          email_enabled?: boolean
          id?: string
          new_reports?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
          vitals_warnings?: boolean
        }
        Relationships: []
      }
      offline_queue: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          request_data: Json
          request_type: string
          retry_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          request_data: Json
          request_type: string
          retry_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          request_data?: Json
          request_type?: string
          retry_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          license_number: string | null
          organization: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id: string
          license_number?: string | null
          organization?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          organization?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          actions_performed: Json | null
          browser: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          page_views: number | null
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          actions_performed?: Json | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          page_views?: number | null
          session_end?: string | null
          session_start?: string
          user_id: string
        }
        Update: {
          actions_performed?: Json | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          page_views?: number | null
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          device_type: string | null
          heart_rate: number | null
          id: string
          oxygen_saturation: number | null
          synced_at: string
          temperature: number | null
          user_id: string
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          device_type?: string | null
          heart_rate?: number | null
          id?: string
          oxygen_saturation?: number | null
          synced_at?: string
          temperature?: number | null
          user_id: string
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          device_type?: string | null
          heart_rate?: number | null
          id?: string
          oxygen_saturation?: number | null
          synced_at?: string
          temperature?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient" | "caregiver"
      consent_type:
        | "device_data"
        | "doctor_access"
        | "location"
        | "notifications"
        | "data_sharing"
        | "terms_of_service"
        | "privacy_policy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "patient", "caregiver"],
      consent_type: [
        "device_data",
        "doctor_access",
        "location",
        "notifications",
        "data_sharing",
        "terms_of_service",
        "privacy_policy",
      ],
    },
  },
} as const
