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
      birth_records: {
        Row: {
          apgar_1min: number | null
          apgar_5min: number | null
          baby_gender: string | null
          baby_length: number | null
          baby_name: string | null
          baby_weight: number | null
          birth_date: string
          birth_location: string | null
          birth_notes: string | null
          birth_plan: Json | null
          birth_time: string | null
          birth_type: string | null
          complications: string | null
          created_at: string
          id: string
          pregnancy_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apgar_1min?: number | null
          apgar_5min?: number | null
          baby_gender?: string | null
          baby_length?: number | null
          baby_name?: string | null
          baby_weight?: number | null
          birth_date: string
          birth_location?: string | null
          birth_notes?: string | null
          birth_plan?: Json | null
          birth_time?: string | null
          birth_type?: string | null
          complications?: string | null
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apgar_1min?: number | null
          apgar_5min?: number | null
          baby_gender?: string | null
          baby_length?: number | null
          baby_name?: string | null
          baby_weight?: number | null
          birth_date?: string
          birth_location?: string | null
          birth_notes?: string | null
          birth_plan?: Json | null
          birth_time?: string | null
          birth_type?: string | null
          complications?: string | null
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birth_records_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancy_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
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
      fertility_logs: {
        Row: {
          cervical_mucus: string | null
          cervix_firmness: string | null
          cervix_position: string | null
          created_at: string
          date: string
          id: string
          intercourse: boolean | null
          intercourse_protected: boolean | null
          lh_level: number | null
          notes: string | null
          opk_result: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cervical_mucus?: string | null
          cervix_firmness?: string | null
          cervix_position?: string | null
          created_at?: string
          date: string
          id?: string
          intercourse?: boolean | null
          intercourse_protected?: boolean | null
          lh_level?: number | null
          notes?: string | null
          opk_result?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cervical_mucus?: string | null
          cervix_firmness?: string | null
          cervix_position?: string | null
          created_at?: string
          date?: string
          id?: string
          intercourse?: boolean | null
          intercourse_protected?: boolean | null
          lh_level?: number | null
          notes?: string | null
          opk_result?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          date: string
          fat: number | null
          fiber: number | null
          food_name: string
          id: string
          iron: number | null
          is_craving: boolean | null
          meal_type: string
          notes: string | null
          protein: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date: string
          fat?: number | null
          fiber?: number | null
          food_name: string
          id?: string
          iron?: number | null
          is_craving?: boolean | null
          meal_type?: string
          notes?: string | null
          protein?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date?: string
          fat?: number | null
          fiber?: number | null
          food_name?: string
          id?: string
          iron?: number | null
          is_craving?: boolean | null
          meal_type?: string
          notes?: string | null
          protein?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
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
      postpartum_logs: {
        Row: {
          anxiety_level: number | null
          birth_record_id: string | null
          bleeding_intensity: string | null
          breastfeeding: boolean | null
          breastfeeding_issues: string | null
          created_at: string
          date: string
          emotional_symptoms: string[] | null
          id: string
          mood_rating: number | null
          notes: string | null
          pain_level: number | null
          physical_symptoms: string[] | null
          sleep_hours: number | null
          support_received: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anxiety_level?: number | null
          birth_record_id?: string | null
          bleeding_intensity?: string | null
          breastfeeding?: boolean | null
          breastfeeding_issues?: string | null
          created_at?: string
          date: string
          emotional_symptoms?: string[] | null
          id?: string
          mood_rating?: number | null
          notes?: string | null
          pain_level?: number | null
          physical_symptoms?: string[] | null
          sleep_hours?: number | null
          support_received?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anxiety_level?: number | null
          birth_record_id?: string | null
          bleeding_intensity?: string | null
          breastfeeding?: boolean | null
          breastfeeding_issues?: string | null
          created_at?: string
          date?: string
          emotional_symptoms?: string[] | null
          id?: string
          mood_rating?: number | null
          notes?: string | null
          pain_level?: number | null
          physical_symptoms?: string[] | null
          sleep_hours?: number | null
          support_received?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postpartum_logs_birth_record_id_fkey"
            columns: ["birth_record_id"]
            isOneToOne: false
            referencedRelation: "birth_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_logs: {
        Row: {
          appointment_notes: string | null
          baby_movements: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          date: string
          id: string
          mood: string | null
          notes: string | null
          pregnancy_id: string
          symptoms: string[] | null
          updated_at: string
          user_id: string
          week_number: number | null
          weight: number | null
        }
        Insert: {
          appointment_notes?: string | null
          baby_movements?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          date: string
          id?: string
          mood?: string | null
          notes?: string | null
          pregnancy_id: string
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          week_number?: number | null
          weight?: number | null
        }
        Update: {
          appointment_notes?: string | null
          baby_movements?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          pregnancy_id?: string
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          week_number?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pregnancy_logs_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancy_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_tracking: {
        Row: {
          conception_date: string | null
          created_at: string
          due_date: string
          id: string
          is_active: boolean | null
          last_period_date: string | null
          notes: string | null
          pregnancy_confirmed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conception_date?: string | null
          created_at?: string
          due_date: string
          id?: string
          is_active?: boolean | null
          last_period_date?: string | null
          notes?: string | null
          pregnancy_confirmed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conception_date?: string | null
          created_at?: string
          due_date?: string
          id?: string
          is_active?: boolean | null
          last_period_date?: string | null
          notes?: string | null
          pregnancy_confirmed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          id: string
          name: string | null
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          date: string
          dream_description: string | null
          dream_logged: boolean | null
          dream_mood: string | null
          dream_tags: string[] | null
          id: string
          night_wakings: number | null
          notes: string | null
          sleep_aids: string | null
          sleep_hours: number | null
          sleep_quality: string | null
          sleep_score: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          date: string
          dream_description?: string | null
          dream_logged?: boolean | null
          dream_mood?: string | null
          dream_tags?: string[] | null
          id?: string
          night_wakings?: number | null
          notes?: string | null
          sleep_aids?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          sleep_score?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          date?: string
          dream_description?: string | null
          dream_logged?: boolean | null
          dream_mood?: string | null
          dream_tags?: string[] | null
          id?: string
          night_wakings?: number | null
          notes?: string | null
          sleep_aids?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          sleep_score?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
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
      workout_goals: {
        Row: {
          calories_per_week: number
          created_at: string
          id: string
          minutes_per_week: number
          updated_at: string
          user_id: string
          workouts_per_week: number
        }
        Insert: {
          calories_per_week?: number
          created_at?: string
          id?: string
          minutes_per_week?: number
          updated_at?: string
          user_id: string
          workouts_per_week?: number
        }
        Update: {
          calories_per_week?: number
          created_at?: string
          id?: string
          minutes_per_week?: number
          updated_at?: string
          user_id?: string
          workouts_per_week?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          created_at: string
          date: string
          distance_km: number | null
          duration_minutes: number | null
          heart_rate_avg: number | null
          heart_rate_max: number | null
          id: string
          intensity: string | null
          notes: string | null
          rating: number | null
          reps: number | null
          sets: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_category: string
          workout_type: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          date: string
          distance_km?: number | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          rating?: number | null
          reps?: number | null
          sets?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
          workout_category: string
          workout_type: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          date?: string
          distance_km?: number | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          rating?: number | null
          reps?: number | null
          sets?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_category?: string
          workout_type?: string
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
