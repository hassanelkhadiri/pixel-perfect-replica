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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_briefs: {
        Row: {
          created_at: string
          id: string
          project_id: string
          questions: string[] | null
          risks: string[] | null
          suggested_timeline: string | null
          suggested_workflow: string[] | null
          summary: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          questions?: string[] | null
          risks?: string[] | null
          suggested_timeline?: string | null
          suggested_workflow?: string[] | null
          summary?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          questions?: string[] | null
          risks?: string[] | null
          suggested_timeline?: string | null
          suggested_workflow?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          annotation: string | null
          common_mistakes: string[] | null
          countdown_ends_at: string | null
          created_at: string
          decided_at: string | null
          description: string | null
          id: string
          project_id: string
          rejection_count: number
          senior_tips: string[] | null
          stage_key: string
          stage_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["stage_status"]
          submission_notes: string | null
          submitted_at: string | null
          time_estimate: string | null
          title: string
        }
        Insert: {
          annotation?: string | null
          common_mistakes?: string[] | null
          countdown_ends_at?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          rejection_count?: number
          senior_tips?: string[] | null
          stage_key: string
          stage_order: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          submission_notes?: string | null
          submitted_at?: string | null
          time_estimate?: string | null
          title: string
        }
        Update: {
          annotation?: string | null
          common_mistakes?: string[] | null
          countdown_ends_at?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          rejection_count?: number
          senior_tips?: string[] | null
          stage_key?: string
          stage_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          submission_notes?: string | null
          submitted_at?: string | null
          time_estimate?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to: string | null
          audience: string | null
          brand: string | null
          brief: string | null
          campaign: string | null
          client: string
          created_at: string
          created_by: string
          current_stage_order: number
          deadline: string | null
          deliverables: string[] | null
          discipline: Database["public"]["Enums"]["project_discipline"]
          id: string
          notes: string | null
          objective: string | null
          platform: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audience?: string | null
          brand?: string | null
          brief?: string | null
          campaign?: string | null
          client: string
          created_at?: string
          created_by: string
          current_stage_order?: number
          deadline?: string | null
          deliverables?: string[] | null
          discipline: Database["public"]["Enums"]["project_discipline"]
          id?: string
          notes?: string | null
          objective?: string | null
          platform?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audience?: string | null
          brand?: string | null
          brief?: string | null
          campaign?: string | null
          client?: string
          created_at?: string
          created_by?: string
          current_stage_order?: number
          deadline?: string | null
          deliverables?: string[] | null
          discipline?: Database["public"]["Enums"]["project_discipline"]
          id?: string
          notes?: string | null
          objective?: string | null
          platform?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          action: Database["public"]["Enums"]["review_action"]
          comment: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          reviewer_id: string
          stage_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["review_action"]
          comment?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reviewer_id: string
          stage_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["review_action"]
          comment?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reviewer_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_checklist_items: {
        Row: {
          done: boolean
          id: string
          item_order: number
          label: string
          stage_id: string
        }
        Insert: {
          done?: boolean
          id?: string
          item_order?: number
          label: string
          stage_id: string
        }
        Update: {
          done?: boolean
          id?: string
          item_order?: number
          label?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_checklist_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
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
      app_role: "director" | "designer" | "editor"
      priority_level: "low" | "medium" | "high" | "urgent"
      project_discipline: "designer" | "editor"
      project_status: "active" | "completed" | "archived"
      review_action: "approve" | "reject" | "revision" | "comment"
      stage_status:
        | "locked"
        | "active"
        | "in_review"
        | "approved"
        | "revision"
        | "rejected"
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
      app_role: ["director", "designer", "editor"],
      priority_level: ["low", "medium", "high", "urgent"],
      project_discipline: ["designer", "editor"],
      project_status: ["active", "completed", "archived"],
      review_action: ["approve", "reject", "revision", "comment"],
      stage_status: [
        "locked",
        "active",
        "in_review",
        "approved",
        "revision",
        "rejected",
      ],
    },
  },
} as const
