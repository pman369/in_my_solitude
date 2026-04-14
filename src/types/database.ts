// Supabase generated types placeholder
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
// after connecting your Supabase project

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          category_id: string | null
          description: string | null
          cover_url: string | null
          file_url: string | null
          is_restricted: boolean
          tags: string[] | null
          added_date: string | null
          curator_note: string | null
          views: number
          downloads: number
          is_published: boolean
          language: string
          publish_date: string | null
          file_size_bytes: number
          uploaded_by: string | null
          last_modified_by: string | null
          last_modified_at: string | null
          download_enabled: boolean
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          category_id?: string | null
          description?: string | null
          cover_url?: string | null
          file_url?: string | null
          is_restricted?: boolean
          tags?: string[] | null
          added_date?: string | null
          curator_note?: string | null
          views?: number
          downloads?: number
          is_published?: boolean
          language?: string
          publish_date?: string | null
          file_size_bytes?: number
          uploaded_by?: string | null
          last_modified_by?: string | null
          last_modified_at?: string | null
          download_enabled?: boolean
        }
        Update: Partial<Database['public']['Tables']['books']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          role: string
          reason_joined: string | null
          reading_focus: string[] | null
          is_public: boolean
          show_reading_list: boolean
          email_notifications: boolean
          theme_preference: string
          font_size: string
          font_family: string
          reduce_motion: boolean
          high_contrast: boolean
          line_spacing: string
          books_read_count: number
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      vault_access_requests: {
        Row: {
          id: string
          user_id: string
          book_id: string
          reason: string
          background: string | null
          status: string
          admin_note: string | null
          requested_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          reason: string
          background?: string | null
          status?: string
          admin_note?: string | null
          requested_at?: string
          reviewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['vault_access_requests']['Insert']>
      }
      book_requests: {
        Row: {
          id: string
          user_id: string | null
          book_title: string
          book_author: string | null
          why_needed: string | null
          status: string
          admin_note: string | null
          requested_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          book_title: string
          book_author?: string | null
          why_needed?: string | null
          status?: string
          admin_note?: string | null
          requested_at?: string
        }
        Update: Partial<Database['public']['Tables']['book_requests']['Insert']>
      }
      book_donations: {
        Row: {
          id: string
          user_id: string | null
          book_title: string
          book_author: string | null
          file_url: string | null
          notes: string | null
          suggested_category: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          book_title: string
          book_author?: string | null
          file_url?: string | null
          notes?: string | null
          suggested_category?: string | null
          status?: string
          submitted_at?: string
        }
        Update: Partial<Database['public']['Tables']['book_donations']['Insert']>
      }
      reading_list: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: string
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status?: string
          added_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reading_list']['Insert']>
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          book_id: string
          current_page: number
          total_pages: number | null
          percent: number
          last_read_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          current_page?: number
          total_pages?: number | null
          percent?: number
          last_read_at?: string
        }
        Update: Partial<Database['public']['Tables']['reading_progress']['Insert']>
      }
      book_notes: {
        Row: {
          id: string
          user_id: string
          book_id: string
          note: string
          page_ref: number | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          note: string
          page_ref?: number | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['book_notes']['Insert']>
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_token: string | null
          context_page: string | null
          context_book_id: string | null
          started_at: string
          last_active: string
          message_count: number
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_token?: string | null
          context_page?: string | null
          context_book_id?: string | null
          started_at?: string
          last_active?: string
          message_count?: number
        }
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          sources: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          sources?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      chat_rate_limits: {
        Row: {
          identifier: string
          message_count: number
          window_start: string
          last_message: string
        }
        Insert: {
          identifier: string
          message_count?: number
          window_start?: string
          last_message?: string
        }
        Update: Partial<Database['public']['Tables']['chat_rate_limits']['Insert']>
      }
      notification_preferences: {
        Row: {
          user_id: string
          vault_request_updates: boolean
          book_request_fulfilled: boolean
          new_books_in_category: boolean
          library_announcements: boolean
          donation_status_updates: boolean
        }
        Insert: {
          user_id: string
          vault_request_updates?: boolean
          book_request_fulfilled?: boolean
          new_books_in_category?: boolean
          library_announcements?: boolean
          donation_status_updates?: boolean
        }
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>
      }
      admin_activity_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Json | null
          performed_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Json | null
          performed_at?: string
        }
        Update: Partial<Database['public']['Tables']['admin_activity_log']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
