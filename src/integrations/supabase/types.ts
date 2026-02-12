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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clinical_assessments: {
        Row: {
          additional_notes: string | null
          bloating_vas: number | null
          created_at: string
          date: string
          fatigue_vas: number | null
          id: string
          mood_vas: number | null
          pain_vas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          bloating_vas?: number | null
          created_at?: string
          date?: string
          fatigue_vas?: number | null
          id?: string
          mood_vas?: number | null
          pain_vas?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          bloating_vas?: number | null
          created_at?: string
          date?: string
          fatigue_vas?: number | null
          id?: string
          mood_vas?: number | null
          pain_vas?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          length: number | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          length?: number | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          length?: number | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      period_logs: {
        Row: {
          created_at: string
          date: string
          exercise_minutes: number | null
          flow_intensity: string | null
          id: string
          is_period: boolean
          medications: Json | null
          moods: string[] | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: string | null
          symptoms: string[] | null
          temperature: number | null
          updated_at: string
          user_id: string
          water_intake: number | null
        }
        Insert: {
          created_at?: string
          date: string
          exercise_minutes?: number | null
          flow_intensity?: string | null
          id?: string
          is_period?: boolean
          medications?: Json | null
          moods?: string[] | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          symptoms?: string[] | null
          temperature?: number | null
          updated_at?: string
          user_id: string
          water_intake?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          exercise_minutes?: number | null
          flow_intensity?: string | null
          id?: string
          is_period?: boolean
          medications?: Json | null
          moods?: string[] | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          symptoms?: string[] | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
          water_intake?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          cycle_length: number
          daily_log_reminder: boolean
          daily_log_reminder_time: string
          date_format: string
          fertile_window_reminder: boolean
          first_day_of_week: number
          id: string
          luteal_phase_length: number
          ovulation_reminder: boolean
          period_length: number
          period_reminder: boolean
          period_reminder_days: number
          show_fertile_window: boolean
          show_ovulation: boolean
          tracking_goal: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_length?: number
          daily_log_reminder?: boolean
          daily_log_reminder_time?: string
          date_format?: string
          fertile_window_reminder?: boolean
          first_day_of_week?: number
          id?: string
          luteal_phase_length?: number
          ovulation_reminder?: boolean
          period_length?: number
          period_reminder?: boolean
          period_reminder_days?: number
          show_fertile_window?: boolean
          show_ovulation?: boolean
          tracking_goal?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_length?: number
          daily_log_reminder?: boolean
          daily_log_reminder_time?: string
          date_format?: string
          fertile_window_reminder?: boolean
          first_day_of_week?: number
          id?: string
          luteal_phase_length?: number
          ovulation_reminder?: boolean
          period_length?: number
          period_reminder?: boolean
          period_reminder_days?: number
          show_fertile_window?: boolean
          show_ovulation?: boolean
          tracking_goal?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_journal: {
        Row: {
          affirmation: string | null
          created_at: string
          date: string
          energy_level: number | null
          gratitude: string | null
          id: string
          mood_rating: number | null
          reflection: string | null
          self_care_done: boolean | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affirmation?: string | null
          created_at?: string
          date?: string
          energy_level?: number | null
          gratitude?: string | null
          id?: string
          mood_rating?: number | null
          reflection?: string | null
          self_care_done?: boolean | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affirmation?: string | null
          created_at?: string
          date?: string
          energy_level?: number | null
          gratitude?: string | null
          id?: string
          mood_rating?: number | null
          reflection?: string | null
          self_care_done?: boolean | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
