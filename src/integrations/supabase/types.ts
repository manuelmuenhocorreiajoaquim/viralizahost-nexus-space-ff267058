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
      cpanel_accounts: {
        Row: {
          bandwidth_quota_mb: number | null
          cpanel_url: string | null
          created_at: string
          disk_quota_mb: number | null
          domain: string
          expiry_date: string | null
          id: string
          last_error: string | null
          nameservers: Json
          order_id: string | null
          package: string | null
          password_encrypted: string | null
          plan_name: string | null
          provisioned_at: string | null
          server: string | null
          server_id: string | null
          server_ip: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          bandwidth_quota_mb?: number | null
          cpanel_url?: string | null
          created_at?: string
          disk_quota_mb?: number | null
          domain: string
          expiry_date?: string | null
          id?: string
          last_error?: string | null
          nameservers?: Json
          order_id?: string | null
          package?: string | null
          password_encrypted?: string | null
          plan_name?: string | null
          provisioned_at?: string | null
          server?: string | null
          server_id?: string | null
          server_ip?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          bandwidth_quota_mb?: number | null
          cpanel_url?: string | null
          created_at?: string
          disk_quota_mb?: number | null
          domain?: string
          expiry_date?: string | null
          id?: string
          last_error?: string | null
          nameservers?: Json
          order_id?: string | null
          package?: string | null
          password_encrypted?: string | null
          plan_name?: string | null
          provisioned_at?: string | null
          server?: string | null
          server_id?: string | null
          server_ip?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpanel_accounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpanel_accounts_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "whm_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          domain: string
          expires_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          expires_at?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          expires_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          accounts_count: number
          created_at: string
          id: string
          plan_name: string
          status: string
          storage_gb: number
          user_id: string
        }
        Insert: {
          accounts_count?: number
          created_at?: string
          id?: string
          plan_name: string
          status?: string
          storage_gb?: number
          user_id: string
        }
        Update: {
          accounts_count?: number
          created_at?: string
          id?: string
          plan_name?: string
          status?: string
          storage_gb?: number
          user_id?: string
        }
        Relationships: []
      }
      hosting_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_annual: number
          price_monthly: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_annual?: number
          price_monthly?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_annual?: number
          price_monthly?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          cycle: string
          domain: string | null
          id: string
          metadata: Json
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          cycle?: string
          domain?: string | null
          id?: string
          metadata?: Json
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          cycle?: string
          domain?: string | null
          id?: string
          metadata?: Json
          order_id?: string
          product_id?: string
          product_name?: string
          product_type?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          cycle: string
          discount: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_ref: string | null
          provisioned: boolean
          provisioning_error: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          cycle?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          provisioned?: boolean
          provisioning_error?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          cycle?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          provisioned?: boolean
          provisioning_error?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          order_id: string | null
          paid_at: string | null
          provider: string | null
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provisioning_logs: {
        Row: {
          cpanel_account_id: string | null
          created_at: string
          event: string
          id: string
          order_id: string | null
          payload: Json
          success: boolean
          user_id: string | null
        }
        Insert: {
          cpanel_account_id?: string | null
          created_at?: string
          event: string
          id?: string
          order_id?: string | null
          payload?: Json
          success?: boolean
          user_id?: string | null
        }
        Update: {
          cpanel_account_id?: string | null
          created_at?: string
          event?: string
          id?: string
          order_id?: string | null
          payload?: Json
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_logs_cpanel_account_id_fkey"
            columns: ["cpanel_account_id"]
            isOneToOne: false
            referencedRelation: "cpanel_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          name: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      whm_servers: {
        Row: {
          active: boolean
          api_url: string
          created_at: string
          current_accounts: number
          hostname: string
          id: string
          max_accounts: number
          name: string
          nameserver1: string
          nameserver2: string
          nameservers: Json
          notes: string | null
          server_ip: string | null
          token: string | null
          token_encrypted: string | null
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          api_url: string
          created_at?: string
          current_accounts?: number
          hostname: string
          id?: string
          max_accounts?: number
          name: string
          nameserver1: string
          nameserver2: string
          nameservers?: Json
          notes?: string | null
          server_ip?: string | null
          token?: string | null
          token_encrypted?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          api_url?: string
          created_at?: string
          current_accounts?: number
          hostname?: string
          id?: string
          max_accounts?: number
          name?: string
          nameserver1?: string
          nameserver2?: string
          nameservers?: Json
          notes?: string | null
          server_ip?: string | null
          token?: string | null
          token_encrypted?: string | null
          updated_at?: string
          username?: string
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
