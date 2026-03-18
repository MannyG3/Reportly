export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Supabase typed Database definition.
 * Keep in sync with your Supabase schema.
 */
export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          brand_color: string | null;
          custom_domain: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_color?: string | null;
          custom_domain?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          brand_color?: string | null;
          custom_domain?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          agency_id: string;
          email: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          email: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          email?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_agency_id_fkey';
            columns: ['agency_id'];
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          agency_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: 'starter' | 'pro' | 'enterprise';
          status:
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
            | 'active'
            | 'past_due'
            | 'canceled'
            | 'unpaid';
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          agency_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: 'starter' | 'pro' | 'enterprise';
          status:
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
            | 'active'
            | 'past_due'
            | 'canceled'
            | 'unpaid';
          current_period_end?: string | null;
        };
        Update: {
          id?: string;
          agency_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          plan?: 'starter' | 'pro' | 'enterprise';
          status?:
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
            | 'active'
            | 'past_due'
            | 'canceled'
            | 'unpaid';
          current_period_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_agency_id_fkey';
            columns: ['agency_id'];
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          email: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          email?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          email?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_agency_id_fkey';
            columns: ['agency_id'];
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          id: string;
          agency_id: string;
          platform: 'google_analytics' | 'google_ads';
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
        };
        Insert: {
          id?: string;
          agency_id: string;
          platform: 'google_analytics' | 'google_ads';
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
        };
        Update: {
          id?: string;
          agency_id?: string;
          platform?: 'google_analytics' | 'google_ads';
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'integrations_agency_id_fkey';
            columns: ['agency_id'];
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          agency_id: string;
          client_id: string;
          title: string;
          status: 'draft' | 'generating' | 'ready' | 'failed';
          share_token: string | null;
          generated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          client_id: string;
          title: string;
          status?: 'draft' | 'generating' | 'ready' | 'failed';
          share_token?: string | null;
          generated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          client_id?: string;
          title?: string;
          status?: 'draft' | 'generating' | 'ready' | 'failed';
          share_token?: string | null;
          generated_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_agency_id_fkey';
            columns: ['agency_id'];
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
      };
      report_sections: {
        Row: {
          id: string;
          report_id: string;
          section_type: string;
          data_snapshot: Json;
          sort_order: number;
        };
        Insert: {
          id?: string;
          report_id: string;
          section_type: string;
          data_snapshot: Json;
          sort_order: number;
        };
        Update: {
          id?: string;
          report_id?: string;
          section_type?: string;
          data_snapshot?: Json;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'report_sections_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

