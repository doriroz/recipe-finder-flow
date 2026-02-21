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
      ai_usage_logs: {
        Row: {
          action_type: string
          created_at: string
          credits_used: number | null
          id: string
          source: string | null
          tokens_estimated: number | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_used?: number | null
          id?: string
          source?: string | null
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_used?: number | null
          id?: string
          source?: string | null
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ingredient_substitutions: {
        Row: {
          alternative_ingredient: string
          confidence: string
          created_at: string
          id: string
          is_valid: boolean
          original_ingredient: string
          reason: string
          tips: string | null
        }
        Insert: {
          alternative_ingredient: string
          confidence?: string
          created_at?: string
          id?: string
          is_valid?: boolean
          original_ingredient: string
          reason: string
          tips?: string | null
        }
        Update: {
          alternative_ingredient?: string
          confidence?: string
          created_at?: string
          id?: string
          is_valid?: boolean
          original_ingredient?: string
          reason?: string
          tips?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      recipe_library: {
        Row: {
          category: string | null
          cooking_time: number | null
          created_at: string
          difficulty: string | null
          id: string
          ingredient_names: string[]
          ingredients: Json
          instructions: string[]
          substitutions: Json | null
          title: string
        }
        Insert: {
          category?: string | null
          cooking_time?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          ingredient_names?: string[]
          ingredients?: Json
          instructions?: string[]
          substitutions?: Json | null
          title: string
        }
        Update: {
          category?: string | null
          cooking_time?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          ingredient_names?: string[]
          ingredients?: Json
          instructions?: string[]
          substitutions?: Json | null
          title?: string
        }
        Relationships: []
      }
      recipe_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cooking_time: number | null
          created_at: string | null
          id: string
          ingredients: Json
          instructions: string[]
          substitutions: Json | null
          title: string
          user_id: string | null
        }
        Insert: {
          cooking_time?: number | null
          created_at?: string | null
          id?: string
          ingredients: Json
          instructions: string[]
          substitutions?: Json | null
          title: string
          user_id?: string | null
        }
        Update: {
          cooking_time?: number | null
          created_at?: string | null
          id?: string
          ingredients?: Json
          instructions?: string[]
          substitutions?: Json | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      translation_cache: {
        Row: {
          created_at: string
          id: string
          lang_pair: string
          source_text: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          lang_pair?: string
          source_text: string
          translated_text: string
        }
        Update: {
          created_at?: string
          id?: string
          lang_pair?: string
          source_text?: string
          translated_text?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          daily_ai_calls: number
          daily_reset_at: string
          id: string
          total_ai_calls: number
          total_local_matches: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          daily_ai_calls?: number
          daily_reset_at?: string
          id?: string
          total_ai_calls?: number
          total_local_matches?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          daily_ai_calls?: number
          daily_reset_at?: string
          id?: string
          total_ai_calls?: number
          total_local_matches?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gallery: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          recipe_id: string | null
          user_id: string | null
          user_notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          recipe_id?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          recipe_id?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gallery_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
