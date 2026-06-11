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
          disk_used_mb: number | null
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
          disk_used_mb?: number | null
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
          disk_used_mb?: number | null
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
      domain_orders: {
        Row: {
          activated_at: string | null
          admin_activated_by: string | null
          admin_notes: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          domain_name: string
          extension: string
          hostinger_purchased_at: string | null
          id: string
          metadata: Json
          order_id: string | null
          price: number
          provider: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain_name: string
          extension: string
          hostinger_purchased_at?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          price?: number
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain_name?: string
          extension?: string
          hostinger_purchased_at?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          price?: number
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      domain_search_logs: {
        Row: {
          created_at: string
          id: string
          results: Json
          searched_domain: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json
          searched_domain: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json
          searched_domain?: string
          user_id?: string | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          dns_change_applied_at: string | null
          dns_change_note: string | null
          dns_change_pending: boolean
          dns_change_requested_at: string | null
          dns_records: Json
          domain: string
          domain_order_id: string | null
          expires_at: string | null
          id: string
          nameservers: Json
          status: string
          target_ip: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dns_change_applied_at?: string | null
          dns_change_note?: string | null
          dns_change_pending?: boolean
          dns_change_requested_at?: string | null
          dns_records?: Json
          domain: string
          domain_order_id?: string | null
          expires_at?: string | null
          id?: string
          nameservers?: Json
          status?: string
          target_ip?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dns_change_applied_at?: string | null
          dns_change_note?: string | null
          dns_change_pending?: boolean
          dns_change_requested_at?: string | null
          dns_records?: Json
          domain?: string
          domain_order_id?: string | null
          expires_at?: string | null
          id?: string
          nameservers?: Json
          status?: string
          target_ip?: string | null
          updated_at?: string
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
      email_orders: {
        Row: {
          accounts_count: number
          activated_at: string | null
          admin_activated_by: string | null
          admin_notes: string | null
          cancelled_at: string | null
          cpanel_url: string | null
          created_at: string
          currency: string
          customer_email: string | null
          domain: string | null
          id: string
          metadata: Json
          order_id: string | null
          plan_id: string
          plan_name: string
          price: number
          status: string
          storage_gb: number
          updated_at: string
          user_id: string | null
          webmail_url: string | null
        }
        Insert: {
          accounts_count?: number
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          cpanel_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          plan_id: string
          plan_name: string
          price?: number
          status?: string
          storage_gb?: number
          updated_at?: string
          user_id?: string | null
          webmail_url?: string | null
        }
        Update: {
          accounts_count?: number
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          cpanel_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          plan_id?: string
          plan_name?: string
          price?: number
          status?: string
          storage_gb?: number
          updated_at?: string
          user_id?: string | null
          webmail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_orders: {
        Row: {
          activated_at: string | null
          admin_activated_by: string | null
          admin_notes: string | null
          cancelled_at: string | null
          cpanel_url: string | null
          cpanel_username: string | null
          created_at: string
          currency: string
          customer_email: string | null
          domain: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          plan_id: string
          plan_name: string
          price: number
          server_ip: string | null
          status: string
          storage_gb: number | null
          updated_at: string
          user_id: string | null
          whm_package: string | null
        }
        Insert: {
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          cpanel_url?: string | null
          cpanel_username?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          plan_id: string
          plan_name: string
          price?: number
          server_ip?: string | null
          status?: string
          storage_gb?: number | null
          updated_at?: string
          user_id?: string | null
          whm_package?: string | null
        }
        Update: {
          activated_at?: string | null
          admin_activated_by?: string | null
          admin_notes?: string | null
          cancelled_at?: string | null
          cpanel_url?: string | null
          cpanel_username?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          domain?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          plan_id?: string
          plan_name?: string
          price?: number
          server_ip?: string | null
          status?: string
          storage_gb?: number | null
          updated_at?: string
          user_id?: string | null
          whm_package?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosting_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      hostinger_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          job_id: string | null
          method: string
          request: Json
          response: Json
          status_code: number | null
          success: boolean
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          method?: string
          request?: Json
          response?: Json
          status_code?: number | null
          success?: boolean
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          method?: string
          request?: Json
          response?: Json
          status_code?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hostinger_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "provisioning_jobs"
            referencedColumns: ["id"]
          },
        ]
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
          payment_status: string
          provisioned: boolean
          provisioning_error: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
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
          payment_status?: string
          provisioned?: boolean
          provisioning_error?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
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
          payment_status?: string
          provisioned?: boolean
          provisioning_error?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          order_id: string | null
          paid_at: string | null
          pix_copy_paste: string | null
          provider: string | null
          provider_payment_id: string | null
          provider_ref: string | null
          qr_code: string | null
          qr_code_base64: string | null
          raw_response: Json
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json
          status?: string
          updated_at?: string
          user_id?: string | null
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
          must_change_password: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          must_change_password?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_products: {
        Row: {
          active: boolean
          auto_provision: boolean
          created_at: string
          currency: string
          id: string
          internal_price: number
          internal_product_id: string
          internal_product_name: string
          notes: string | null
          provider: string
          provider_metadata: Json
          provider_price_id: string | null
          provider_service_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          auto_provision?: boolean
          created_at?: string
          currency?: string
          id?: string
          internal_price?: number
          internal_product_id: string
          internal_product_name: string
          notes?: string | null
          provider?: string
          provider_metadata?: Json
          provider_price_id?: string | null
          provider_service_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          auto_provision?: boolean
          created_at?: string
          currency?: string
          id?: string
          internal_price?: number
          internal_product_id?: string
          internal_product_name?: string
          notes?: string | null
          provider?: string
          provider_metadata?: Json
          provider_price_id?: string | null
          provider_service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      provisioning_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          order_id: string | null
          order_item_id: string | null
          provider: string
          provider_product_id: string | null
          provider_request: Json
          provider_resource_id: string | null
          provider_response: Json
          provider_service_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          order_item_id?: string | null
          provider?: string
          provider_product_id?: string | null
          provider_request?: Json
          provider_resource_id?: string | null
          provider_response?: Json
          provider_service_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          order_item_id?: string | null
          provider?: string
          provider_product_id?: string | null
          provider_request?: Json
          provider_resource_id?: string | null
          provider_response?: Json
          provider_service_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_jobs_provider_product_id_fkey"
            columns: ["provider_product_id"]
            isOneToOne: false
            referencedRelation: "provider_products"
            referencedColumns: ["id"]
          },
        ]
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
      service_plans: {
        Row: {
          badge: string | null
          benefits: Json
          category: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          currency_default: string
          id: string
          is_active: boolean
          is_featured: boolean
          metadata: Json
          name: string
          price_aoa: number | null
          price_brl: number | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          benefits?: Json
          category: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          currency_default?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          name: string
          price_aoa?: number | null
          price_brl?: number | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          benefits?: Json
          category?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          currency_default?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          name?: string
          price_aoa?: number | null
          price_brl?: number | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          name: string
          provisioning_job_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          provisioning_job_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          provisioning_job_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provisioning_job_id_fkey"
            columns: ["provisioning_job_id"]
            isOneToOne: false
            referencedRelation: "provisioning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_contents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_images: {
        Row: {
          alt: string | null
          bucket: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          bucket?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          bucket?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          body: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          image_url: string | null
          is_active: boolean
          key: string
          metadata: Json
          page: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          key: string
          metadata?: Json
          page?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          key?: string
          metadata?: Json
          page?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
