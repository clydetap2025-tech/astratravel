// Generated from the Supabase project (supabase gen types typescript). Do not edit by hand.
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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          city_id: string | null
          created_at: string
          id: string
          place_id: string | null
          shared_with_support: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          id?: string
          place_id?: string | null
          shared_with_support?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          id?: string
          place_id?: string | null
          shared_with_support?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_guest_usage: {
        Row: {
          day: string
          ip_hash: string
          used: number
        }
        Insert: {
          day: string
          ip_hash: string
          used?: number
        }
        Update: {
          day?: string
          ip_hash?: string
          used?: number
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: number
          role: string
          status: string
          tokens: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: never
          role: string
          status?: string
          tokens?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: never
          role?: string
          status?: string
          tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_requests: {
        Row: {
          created_at: string
          error_code: string | null
          id: number
          input_tokens: number | null
          kind: string
          model: string
          output_tokens: number | null
          plan_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: never
          input_tokens?: number | null
          kind?: string
          model: string
          output_tokens?: number | null
          plan_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: never
          input_tokens?: number | null
          kind?: string
          model?: string
          output_tokens?: number | null
          plan_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          daily_kzt: number
          level: Database["public"]["Enums"]["budget_level"]
        }
        Insert: {
          daily_kzt: number
          level: Database["public"]["Enums"]["budget_level"]
        }
        Update: {
          daily_kzt?: number
          level?: Database["public"]["Enums"]["budget_level"]
        }
        Relationships: []
      }
      cities: {
        Row: {
          airport: string
          id: string
          lat: number
          lng: number
          name: Json
          region: Json
          sort_order: number
        }
        Insert: {
          airport: string
          id: string
          lat: number
          lng: number
          name: Json
          region: Json
          sort_order?: number
        }
        Update: {
          airport?: string
          id?: string
          lat?: number
          lng?: number
          name?: Json
          region?: Json
          sort_order?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          sort_order: number
        }
        Insert: {
          code: string
          sort_order?: number
        }
        Update: {
          code?: string
          sort_order?: number
        }
        Relationships: []
      }
      country_points: {
        Row: {
          country_code: string
          lat: number
          lng: number
          sort_order: number
        }
        Insert: {
          country_code: string
          lat: number
          lng: number
          sort_order?: number
        }
        Update: {
          country_code?: string
          lat?: number
          lng?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "country_points_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: true
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      place_matches: {
        Row: {
          country_code: string
          place_id: string
        }
        Insert: {
          country_code: string
          place_id: string
        }
        Update: {
          country_code?: string
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_matches_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "place_matches_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: Json
          category: Database["public"]["Enums"]["place_category"]
          checked_at: string | null
          city_id: string
          cost_kzt: number | null
          created_at: string
          has_photo: boolean
          id: string
          is_published: boolean
          lat: number | null
          lng: number | null
          location: Json
          map_query: string
          map_x: number | null
          map_y: number | null
          minutes: number
          photo_author: string | null
          photo_kind: string | null
          photo_license: string | null
          photo_page: string | null
          photo_url: string | null
          sort_order: number
          source_url: string
          summary: Json
          tip: Json
          title: Json
          twogis_url: string | null
          updated_at: string
          zone: Database["public"]["Enums"]["place_zone"]
        }
        Insert: {
          address: Json
          category: Database["public"]["Enums"]["place_category"]
          checked_at?: string | null
          city_id: string
          cost_kzt?: number | null
          created_at?: string
          has_photo?: boolean
          id: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          location: Json
          map_query: string
          map_x?: number | null
          map_y?: number | null
          minutes: number
          photo_author?: string | null
          photo_kind?: string | null
          photo_license?: string | null
          photo_page?: string | null
          photo_url?: string | null
          sort_order?: number
          source_url: string
          summary: Json
          tip: Json
          title: Json
          twogis_url?: string | null
          updated_at?: string
          zone: Database["public"]["Enums"]["place_zone"]
        }
        Update: {
          address?: Json
          category?: Database["public"]["Enums"]["place_category"]
          checked_at?: string | null
          city_id?: string
          cost_kzt?: number | null
          created_at?: string
          has_photo?: boolean
          id?: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          location?: Json
          map_query?: string
          map_x?: number | null
          map_y?: number | null
          minutes?: number
          photo_author?: string | null
          photo_kind?: string | null
          photo_license?: string | null
          photo_page?: string | null
          photo_url?: string | null
          sort_order?: number
          source_url?: string
          summary?: Json
          tip?: Json
          title?: Json
          twogis_url?: string | null
          updated_at?: string
          zone?: Database["public"]["Enums"]["place_zone"]
        }
        Relationships: [
          {
            foreignKeyName: "places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_daily_limit: number | null
          ai_reset_at: string | null
          blocked_at: string | null
          blocked_reason: string | null
          city_id: string | null
          created_at: string
          display_name: string | null
          district: string | null
          id: string
          interests: Database["public"]["Enums"]["place_category"][]
          language: string
          last_seen_at: string | null
          origin: string | null
          role: string
          updated_at: string
          username: string | null
          visitor: string | null
        }
        Insert: {
          ai_daily_limit?: number | null
          ai_reset_at?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city_id?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          id: string
          interests?: Database["public"]["Enums"]["place_category"][]
          language?: string
          last_seen_at?: string | null
          origin?: string | null
          role?: string
          updated_at?: string
          username?: string | null
          visitor?: string | null
        }
        Update: {
          ai_daily_limit?: number | null
          ai_reset_at?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city_id?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          id?: string
          interests?: Database["public"]["Enums"]["place_category"][]
          language?: string
          last_seen_at?: string | null
          origin?: string | null
          role?: string
          updated_at?: string
          username?: string | null
          visitor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_origin_fkey"
            columns: ["origin"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      saved_flights: {
        Row: {
          created_at: string
          flight_key: string
          id: string
          search: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          flight_key: string
          id?: string
          search: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          flight_key?: string
          id?: string
          search?: Json
          user_id?: string
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plan_days: {
        Row: {
          cost_kzt: number
          day_index: number
          minutes: number
          note: string | null
          place_ids: string[]
          plan_id: string
        }
        Insert: {
          cost_kzt: number
          day_index: number
          minutes: number
          note?: string | null
          place_ids: string[]
          plan_id: string
        }
        Update: {
          cost_kzt?: number
          day_index?: number
          minutes?: number
          note?: string | null
          place_ids?: string[]
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plans: {
        Row: {
          budget: Database["public"]["Enums"]["budget_level"]
          city_id: string
          cost_kzt: number
          created_at: string
          days: number
          id: string
          interests: Database["public"]["Enums"]["place_category"][]
          language: string
          mode: Database["public"]["Enums"]["plan_mode"]
          model: string | null
          origin: string | null
          overview: string | null
          user_id: string
        }
        Insert: {
          budget: Database["public"]["Enums"]["budget_level"]
          city_id: string
          cost_kzt: number
          created_at?: string
          days: number
          id?: string
          interests?: Database["public"]["Enums"]["place_category"][]
          language: string
          mode?: Database["public"]["Enums"]["plan_mode"]
          model?: string | null
          origin?: string | null
          overview?: string | null
          user_id?: string
        }
        Update: {
          budget?: Database["public"]["Enums"]["budget_level"]
          city_id?: string
          cost_kzt?: number
          created_at?: string
          days?: number
          id?: string
          interests?: Database["public"]["Enums"]["place_category"][]
          language?: string
          mode?: Database["public"]["Enums"]["plan_mode"]
          model?: string | null
          origin?: string | null
          overview?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plans_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_plans_origin_fkey"
            columns: ["origin"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      user_route: {
        Row: {
          created_at: string
          place_id: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          position: number
          user_id?: string
        }
        Update: {
          created_at?: string
          place_id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_route_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      visited_places: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visited_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_audit_log: {
        Args: {
          actor?: string
          page?: number
          page_size?: number
          since?: string
          table_filter?: string
        }
        Returns: {
          action: string
          actor_email: string
          after: Json
          before: Json
          created_at: string
          id: number
          record_id: string
          table_name: string
          total: number
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      admin_user_detail: { Args: { user_id: string }; Returns: Json }
      admin_users: {
        Args: {
          blocked_only?: boolean
          limit_hit_only?: boolean
          page?: number
          page_size?: number
          role_filter?: string
          search?: string
          sort?: string
        }
        Returns: {
          ai_daily_limit: number
          blocked_at: string
          blocked_reason: string
          city_id: string
          created_at: string
          display_name: string
          email: string
          id: string
          last_seen_at: string
          limit_today: number
          origin: string
          role: string
          total: number
          used_today: number
        }[]
      }
      ai_daily_limit_for: { Args: { for_user: string }; Returns: number }
      ai_limit_status: {
        Args: never
        Returns: {
          ai_enabled: boolean
          blocked: boolean
          daily_limit: number
          messages_left: number
          resets_at: string
        }[]
      }
      ai_messages_left: { Args: never; Returns: number }
      ai_messages_used: { Args: { for_user: string }; Returns: number }
      ai_requests_left: {
        Args: { hourly_limit?: number; window_minutes?: number }
        Returns: number
      }
      almaty_day_start: { Args: { at_time?: string }; Returns: string }
      consume_ai_message: {
        Args: { content: string; conversation: string }
        Returns: {
          left: number
          message_id: number
        }[]
      }
      consume_guest_ai_message: { Args: { ip_hash: string }; Returns: number }
      delete_my_account: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      picks_for: {
        Args: { origin: string }
        Returns: {
          address: Json
          category: Database["public"]["Enums"]["place_category"]
          checked_at: string | null
          city_id: string
          cost_kzt: number | null
          created_at: string
          has_photo: boolean
          id: string
          is_published: boolean
          lat: number | null
          lng: number | null
          location: Json
          map_query: string
          map_x: number | null
          map_y: number | null
          minutes: number
          photo_author: string | null
          photo_kind: string | null
          photo_license: string | null
          photo_page: string | null
          photo_url: string | null
          sort_order: number
          source_url: string
          summary: Json
          tip: Json
          title: Json
          twogis_url: string | null
          updated_at: string
          zone: Database["public"]["Enums"]["place_zone"]
        }[]
        SetofOptions: {
          from: "*"
          to: "places"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      refund_ai_message: { Args: { message: number }; Returns: undefined }
      refund_guest_ai_message: { Args: { ip_hash: string }; Returns: undefined }
      require_admin: { Args: never; Returns: undefined }
      save_ai_reply: {
        Args: { content: string; conversation: string; tokens?: number }
        Returns: number
      }
      set_my_route: { Args: { place_ids: string[] }; Returns: undefined }
      setting: { Args: { setting_key: string }; Returns: Json }
    }
    Enums: {
      budget_level: "light" | "standard" | "flexible"
      place_category: "nature" | "food" | "culture" | "city"
      place_zone: "center" | "outskirts" | "hill" | "mountains" | "daytrip"
      plan_mode: "demo" | "ai"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      budget_level: ["light", "standard", "flexible"],
      place_category: ["nature", "food", "culture", "city"],
      place_zone: ["center", "outskirts", "hill", "mountains", "daytrip"],
      plan_mode: ["demo", "ai"],
    },
  },
} as const
