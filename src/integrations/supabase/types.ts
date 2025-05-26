export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          active: boolean
          color: string
          created_at: string
          display_name: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          display_name: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_records: {
        Row: {
          created_at: string
          group_id: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          meal_date: string
          meal_time: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id?: string
          meal_date?: string
          meal_time?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          meal_date?: string
          meal_time?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_records_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          breakfast_deadline: string
          breakfast_start_time: string | null
          id: string
          lunch_deadline: string
          lunch_start_time: string | null
          updated_at: string
        }
        Insert: {
          breakfast_deadline?: string
          breakfast_start_time?: string | null
          id?: string
          lunch_deadline?: string
          lunch_start_time?: string | null
          updated_at?: string
        }
        Update: {
          breakfast_deadline?: string
          breakfast_start_time?: string | null
          id?: string
          lunch_deadline?: string
          lunch_start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean
          created_at: string
          group_id: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_id?: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          group_id?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      group_type: "operacao" | "projetos" | "pxa" | "visitantes"
      meal_type: "breakfast" | "lunch"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_type: ["operacao", "projetos", "pxa", "visitantes"],
      meal_type: ["breakfast", "lunch"],
    },
  },
} as const
