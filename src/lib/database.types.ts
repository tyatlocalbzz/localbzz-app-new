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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_context: {
        Row: {
          author_id: string
          client_id: string
          content: string
          created_at: string
          cycle_id: string | null
          id: string
          type: Database["public"]["Enums"]["context_type"]
        }
        Insert: {
          author_id: string
          client_id: string
          content: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          type: Database["public"]["Enums"]["context_type"]
        }
        Update: {
          author_id?: string
          client_id?: string
          content?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          type?: Database["public"]["Enums"]["context_type"]
        }
        Relationships: [
          {
            foreignKeyName: "client_context_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_context_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_context_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_task_assignments: {
        Row: {
          assignee_id: string | null
          client_id: string
          created_at: string
          days_offset_override: number | null
          id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_id: string
          created_at?: string
          days_offset_override?: number | null
          id?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string
          created_at?: string
          days_offset_override?: number | null
          id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_task_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_task_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_task_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assets: Json | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          assets?: Json | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          assets?: Json | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          client_id: string
          created_at: string
          id: string
          month: string
          status: Database["public"]["Enums"]["cycle_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          month: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          month?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      shoots: {
        Row: {
          calendar_link: string | null
          client_id: string
          created_at: string
          cycle_id: string | null
          id: string
          location: string | null
          shoot_date: string
          shoot_time: string | null
          status: Database["public"]["Enums"]["shoot_status"]
          type: Database["public"]["Enums"]["shoot_type"]
          updated_at: string
        }
        Insert: {
          calendar_link?: string | null
          client_id: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          location?: string | null
          shoot_date: string
          shoot_time?: string | null
          status?: Database["public"]["Enums"]["shoot_status"]
          type?: Database["public"]["Enums"]["shoot_type"]
          updated_at?: string
        }
        Update: {
          calendar_link?: string | null
          client_id?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          location?: string | null
          shoot_date?: string
          shoot_time?: string | null
          status?: Database["public"]["Enums"]["shoot_status"]
          type?: Database["public"]["Enums"]["shoot_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoots_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          client_id: string | null
          created_at: string | null
          days_offset: number
          id: string
          is_active: boolean
          parent_type: Database["public"]["Enums"]["parent_type"]
          role: Database["public"]["Enums"]["task_role"]
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          days_offset?: number
          id?: string
          is_active?: boolean
          parent_type: Database["public"]["Enums"]["parent_type"]
          role: Database["public"]["Enums"]["task_role"]
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          days_offset?: number
          id?: string
          is_active?: boolean
          parent_type?: Database["public"]["Enums"]["parent_type"]
          role?: Database["public"]["Enums"]["task_role"]
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          due_date: string | null
          id: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["parent_type"]
          role: Database["public"]["Enums"]["task_role"]
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["parent_type"]
          role: Database["public"]["Enums"]["task_role"]
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          parent_id?: string
          parent_type?: Database["public"]["Enums"]["parent_type"]
          role?: Database["public"]["Enums"]["task_role"]
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_client_with_current_cycle: {
        Args: { p_client_id: string }
        Returns: {
          client_id: string
          client_name: string
          client_status: Database["public"]["Enums"]["client_status"]
          cycle_id: string
          cycle_month: string
          cycle_status: Database["public"]["Enums"]["cycle_status"]
        }[]
      }
      get_days_offset: {
        Args: { p_client_id: string; p_template_id: string }
        Returns: number
      }
      recalculate_shoot_due_dates: {
        Args: { p_shoot_id: string }
        Returns: undefined
      }
      schedule_shoot:
        | {
            Args: {
              p_client_id: string
              p_cycle_id: string
              p_shoot_date: string
              p_type?: Database["public"]["Enums"]["shoot_type"]
            }
            Returns: string
          }
        | {
            Args: {
              p_calendar_link?: string
              p_client_id: string
              p_cycle_id: string
              p_location?: string
              p_shoot_date: string
              p_shoot_time?: string
              p_type?: Database["public"]["Enums"]["shoot_type"]
            }
            Returns: string
          }
      start_new_cycle: {
        Args: { p_client_id: string; p_month: string }
        Returns: string
      }
    }
    Enums: {
      client_status: "active" | "archived"
      context_type: "transcript" | "report" | "note"
      cycle_status: "planning" | "active" | "completed"
      parent_type: "cycle" | "shoot"
      shoot_status: "planned" | "shot" | "edited" | "delivered"
      shoot_type: "monthly" | "adhoc"
      task_role: "strategist" | "scheduler" | "shooter" | "editor"
      task_status: "todo" | "done"
      user_role: "admin" | "contributor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      client_status: ["active", "archived"],
      context_type: ["transcript", "report", "note"],
      cycle_status: ["planning", "active", "completed"],
      parent_type: ["cycle", "shoot"],
      shoot_status: ["planned", "shot", "edited", "delivered"],
      shoot_type: ["monthly", "adhoc"],
      task_role: ["strategist", "scheduler", "shooter", "editor"],
      task_status: ["todo", "done"],
      user_role: ["admin", "contributor"],
    },
  },
} as const

// Client assets type
export interface ClientAssets {
  drive_url?: string | null
  schedule_url?: string | null
  brand_url?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  notes?: string | null
}

// Type aliases for easier usage
export type ClientRow = Tables<'clients'>
export type Client = Omit<ClientRow, 'assets'> & { assets: ClientAssets | null }
export type ClientInsert = TablesInsert<'clients'>
export type ClientUpdate = TablesUpdate<'clients'>

export type Cycle = Tables<'cycles'>
export type CycleInsert = TablesInsert<'cycles'>
export type CycleUpdate = TablesUpdate<'cycles'>

export type Shoot = Tables<'shoots'>
export type ShootInsert = TablesInsert<'shoots'>
export type ShootUpdate = TablesUpdate<'shoots'>

export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type TaskTemplate = Tables<'task_templates'>
export type TaskTemplateInsert = TablesInsert<'task_templates'>
export type TaskTemplateUpdate = TablesUpdate<'task_templates'>

export type ClientTaskAssignment = Tables<'client_task_assignments'>
export type ClientTaskAssignmentInsert = TablesInsert<'client_task_assignments'>
export type ClientTaskAssignmentUpdate = TablesUpdate<'client_task_assignments'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type ClientContext = Tables<'client_context'>
export type ClientContextInsert = TablesInsert<'client_context'>
export type ClientContextUpdate = TablesUpdate<'client_context'>

// Enum type aliases
export type ClientStatus = Enums<'client_status'>
export type CycleStatus = Enums<'cycle_status'>
export type ShootStatus = Enums<'shoot_status'>
export type ShootType = Enums<'shoot_type'>
export type TaskStatus = Enums<'task_status'>
export type TaskRole = Enums<'task_role'>
export type ParentType = Enums<'parent_type'>
export type ContextType = Enums<'context_type'>
export type UserRole = Enums<'user_role'>
