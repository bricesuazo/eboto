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
      achievements: {
        Row: {
          created_at: string
          credential_id: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_achievements_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_commissioners_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_admin_commissioners_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "admin_commissioners_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_admin_commissioners_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_commissioners_rooms: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_admin_commissioners_rooms_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliations: {
        Row: {
          created_at: string
          credential_id: string
          deleted_at: string | null
          end_year: string
          id: string
          org_name: string
          org_position: string
          start_year: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          deleted_at?: string | null
          end_year: string
          id?: string
          org_name: string
          org_position: string
          start_year: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          deleted_at?: string | null
          end_year?: string
          id?: string
          org_name?: string
          org_position?: string
          start_year?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_affiliations_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          credential_id: string
          deleted_at: string | null
          election_id: string
          first_name: string
          id: string
          image_path: string | null
          last_name: string
          middle_name: string | null
          partylist_id: string
          position_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          deleted_at?: string | null
          election_id: string
          first_name: string
          id?: string
          image_path?: string | null
          last_name: string
          middle_name?: string | null
          partylist_id: string
          position_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          deleted_at?: string | null
          election_id?: string
          first_name?: string
          id?: string
          image_path?: string | null
          last_name?: string
          middle_name?: string | null
          partylist_id?: string
          position_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_candidates_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_candidates_partylist_id_fkey"
            columns: ["partylist_id"]
            isOneToOne: false
            referencedRelation: "partylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioners: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_commissioners_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_commissioners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioners_voters_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_commissioners_voters_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "commissioners_voters_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_commissioners_voters_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioners_voters_rooms: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_commissioners_voters_rooms_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      elections: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          end_date: string
          id: string
          is_candidates_visible_in_realtime_when_ongoing: boolean
          logo_path: string | null
          name: string
          name_arrangement: number
          no_of_voters: number | null
          publicity: Database["public"]["Enums"]["publicity"]
          slug: string
          start_date: string
          updated_at: string
          variant_id: number
          voter_domain: string | null
          voting_hour_end: number
          voting_hour_start: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          end_date: string
          id?: string
          is_candidates_visible_in_realtime_when_ongoing?: boolean
          logo_path?: string | null
          name: string
          name_arrangement?: number
          no_of_voters?: number | null
          publicity?: Database["public"]["Enums"]["publicity"]
          slug: string
          start_date: string
          updated_at?: string
          variant_id: number
          voter_domain?: string | null
          voting_hour_end?: number
          voting_hour_start?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          end_date?: string
          id?: string
          is_candidates_visible_in_realtime_when_ongoing?: boolean
          logo_path?: string | null
          name?: string
          name_arrangement?: number
          no_of_voters?: number | null
          publicity?: Database["public"]["Enums"]["publicity"]
          slug?: string
          start_date?: string
          updated_at?: string
          variant_id?: number
          voter_domain?: string | null
          voting_hour_end?: number
          voting_hour_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_elections_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      elections_plus: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_elections_plus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events_attended: {
        Row: {
          created_at: string
          credential_id: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_events_attended_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_election_results: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          id: string
          result: Json
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          id?: string
          result: Json
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          id?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "public_generated_election_results_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      partylists: {
        Row: {
          acronym: string
          created_at: string
          deleted_at: string | null
          description: string | null
          election_id: string
          id: string
          logo_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          acronym: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          election_id: string
          id?: string
          logo_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          acronym?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          election_id?: string
          id?: string
          logo_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_partylists_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          candidate_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_platforms_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          election_id: string
          id: string
          max: number
          min: number
          name: string
          order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          election_id: string
          id?: string
          max?: number
          min?: number
          name: string
          order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          election_id?: string
          id?: string
          max?: number
          min?: number
          name?: string
          order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_positions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      reported_problems: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          election_id: string
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: string
          election_id: string
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          election_id?: string
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_reported_problems_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_reported_problems_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          image_path: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          image_path?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          image_path?: string | null
          name?: string | null
        }
        Relationships: []
      }
      variants: {
        Row: {
          id: number
          name: string
          price: number
          product_id: number
        }
        Insert: {
          id?: number
          name: string
          price: number
          product_id: number
        }
        Update: {
          id?: number
          name?: string
          price?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      voter_fields: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_voter_fields_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      voters: {
        Row: {
          created_at: string
          deleted_at: string | null
          election_id: string
          email: string
          field: Json | null
          id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          election_id: string
          email: string
          field?: Json | null
          id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          election_id?: string
          email?: string
          field?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_voters_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          candidate_id: string | null
          created_at: string
          election_id: string
          id: string
          position_id: string | null
          voter_id: string
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          election_id: string
          id?: string
          position_id?: string | null
          voter_id: string
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          election_id?: string
          id?: string
          position_id?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
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
      publicity: "PRIVATE" | "VOTER" | "PUBLIC"
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
      publicity: ["PRIVATE", "VOTER", "PUBLIC"],
    },
  },
} as const

