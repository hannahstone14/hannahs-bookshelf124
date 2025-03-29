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
      books: {
        Row: {
          author: string
          color: string | null
          cover_url: string | null
          created_at: string | null
          date_read: string | null
          favorite: boolean | null
          genres: string[] | null
          id: string
          is_series: boolean | null
          order: number | null
          pages: number | null
          progress: number
          recommended_by: string | null
          series_name: string | null
          series_position: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          date_read?: string | null
          favorite?: boolean | null
          genres?: string[] | null
          id?: string
          is_series?: boolean | null
          order?: number | null
          pages?: number | null
          progress?: number
          recommended_by?: string | null
          series_name?: string | null
          series_position?: number | null
          status: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          date_read?: string | null
          favorite?: boolean | null
          genres?: string[] | null
          id?: string
          is_series?: boolean | null
          order?: number | null
          pages?: number | null
          progress?: number
          recommended_by?: string | null
          series_name?: string | null
          series_position?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          author: string
          color: string | null
          cover_url: string | null
          created_at: string | null
          date_read: string | null
          favorite: boolean | null
          genres: string[] | null
          id: string
          is_series: boolean | null
          pages: number | null
          progress: number
          recommended_by: string | null
          series_name: string | null
          series_position: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          date_read?: string | null
          favorite?: boolean | null
          genres?: string[] | null
          id?: string
          is_series?: boolean | null
          pages?: number | null
          progress?: number
          recommended_by?: string | null
          series_name?: string | null
          series_position?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          date_read?: string | null
          favorite?: boolean | null
          genres?: string[] | null
          id?: string
          is_series?: boolean | null
          pages?: number | null
          progress?: number
          recommended_by?: string | null
          series_name?: string | null
          series_position?: number | null
          status?: string
          title?: string
          updated_at?: string | null
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
