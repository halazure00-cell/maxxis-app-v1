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
      achievements: {
        Row: {
          badge_description: string | null
          badge_name: string
          badge_type: string
          criteria_met: Json | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          badge_type: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          badge_type?: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          auto_save_hotspot: boolean | null
          created_at: string
          default_fuel_cost: number | null
          id: string
          language: string | null
          notification_enabled: boolean | null
          notification_sound: boolean | null
          notification_vibrate: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_hotspot?: boolean | null
          created_at?: string
          default_fuel_cost?: number | null
          id?: string
          language?: string | null
          notification_enabled?: boolean | null
          notification_sound?: boolean | null
          notification_vibrate?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_hotspot?: boolean | null
          created_at?: string
          default_fuel_cost?: number | null
          id?: string
          language?: string | null
          notification_enabled?: boolean | null
          notification_sound?: boolean | null
          notification_vibrate?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          active_hours: number | null
          created_at: string
          health_score: number | null
          id: string
          orders_by_type: Json | null
          summary_date: string
          total_commission: number | null
          total_fuel_cost: number | null
          total_gross: number | null
          total_net: number | null
          total_orders: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_hours?: number | null
          created_at?: string
          health_score?: number | null
          id?: string
          orders_by_type?: Json | null
          summary_date: string
          total_commission?: number | null
          total_fuel_cost?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_orders?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_hours?: number | null
          created_at?: string
          health_score?: number | null
          id?: string
          orders_by_type?: Json | null
          summary_date?: string
          total_commission?: number | null
          total_fuel_cost?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          priority: number | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          priority?: number | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          priority?: number | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          expense_type: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expense_type: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_type?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hotspots: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          downvotes: number | null
          id: string
          is_preset: boolean | null
          is_safe_zone: boolean | null
          latitude: number
          longitude: number
          name: string
          peak_hours: string[] | null
          submitted_by: string | null
          upvotes: number | null
          verified: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          downvotes?: number | null
          id?: string
          is_preset?: boolean | null
          is_safe_zone?: boolean | null
          latitude: number
          longitude: number
          name: string
          peak_hours?: string[] | null
          submitted_by?: string | null
          upvotes?: number | null
          verified?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          downvotes?: number | null
          id?: string
          is_preset?: boolean | null
          is_safe_zone?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          peak_hours?: string[] | null
          submitted_by?: string | null
          upvotes?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      order_logs: {
        Row: {
          created_at: string
          gross_earnings: number | null
          id: string
          log_date: string
          notes: string | null
          orders_auto_rejected: number | null
          orders_cancelled: number | null
          orders_completed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gross_earnings?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          orders_auto_rejected?: number | null
          orders_cancelled?: number | null
          orders_completed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          gross_earnings?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          orders_auto_rejected?: number | null
          orders_cancelled?: number | null
          orders_completed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          commission_amount: number | null
          commission_rate: number
          created_at: string
          fuel_cost: number
          gross_amount: number
          id: string
          net_amount: number | null
          order_type: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_name: string | null
          save_as_hotspot: boolean | null
          user_id: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          fuel_cost?: number
          gross_amount?: number
          id?: string
          net_amount?: number | null
          order_type?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_name?: string | null
          save_as_hotspot?: boolean | null
          user_id: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          fuel_cost?: number
          gross_amount?: number
          id?: string
          net_amount?: number | null
          order_type?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_name?: string | null
          save_as_hotspot?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      panic_alerts: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          message: string | null
          resolved_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          message?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          message?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          attribute_expiry_date: string | null
          attribute_status: string | null
          avatar_url: string | null
          commission_rate: number | null
          created_at: string
          current_rating: number | null
          earnings_today: number | null
          full_name: string
          id: string
          join_date: string | null
          phone: string | null
          total_orders_today: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attribute_expiry_date?: string | null
          attribute_status?: string | null
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          current_rating?: number | null
          earnings_today?: number | null
          full_name?: string
          id?: string
          join_date?: string | null
          phone?: string | null
          total_orders_today?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attribute_expiry_date?: string | null
          attribute_status?: string | null
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          current_rating?: number | null
          earnings_today?: number | null
          full_name?: string
          id?: string
          join_date?: string | null
          phone?: string | null
          total_orders_today?: number | null
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
      calculate_daily_summary: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          active_hours: number | null
          created_at: string
          health_score: number | null
          id: string
          orders_by_type: Json | null
          summary_date: string
          total_commission: number | null
          total_fuel_cost: number | null
          total_gross: number | null
          total_net: number | null
          total_orders: number | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_summaries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_health_score: { Args: { p_user_id: string }; Returns: number }
      get_hotspots_anonymized: {
        Args: never
        Returns: {
          category: string
          created_at: string
          description: string
          downvotes: number
          id: string
          is_owner: boolean
          is_preset: boolean
          is_safe_zone: boolean
          latitude: number
          longitude: number
          name: string
          peak_hours: string[]
          upvotes: number
          verified: boolean
        }[]
      }
      get_nearby_hotspots: {
        Args: { p_lat: number; p_lng: number; p_radius_km?: number }
        Returns: {
          category: string
          description: string
          distance_km: number
          downvotes: number
          id: string
          is_preset: boolean
          is_safe_zone: boolean
          latitude: number
          longitude: number
          name: string
          peak_hours: string[]
          upvotes: number
          verified: boolean
        }[]
      }
      is_hotspot_owner: { Args: { hotspot_id: string }; Returns: boolean }
      reset_daily_profile_stats: { Args: never; Returns: undefined }
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
