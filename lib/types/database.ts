export type MemberStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'member' | 'admin' | 'super_admin';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface DbDesignation {
  id: string;
  name: string;
  category: 'presidents' | 'technical' | 'media' | 'graphics' | 'event_mgmt' | 'cultural_sports' | 'class_rep' | string;
  category_label: string;
  display_order: number;
  description?: string | null;
  is_core: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbProfile {
  id: string;
  user_id?: string | null;
  full_name: string;
  usn?: string | null; // PRIVATE
  branch?: string | null;
  year?: string | null;
  joining_year?: string | null;
  designation_id?: string | null;
  custom_role_text?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null; // PRIVATE
  github_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  portfolio_url?: string | null;
  status: MemberStatus;
  role: UserRole; // PRIVATE
  rejection_reason?: string | null; // PRIVATE
  created_at?: string;
  updated_at?: string;
  designations?: DbDesignation | null;
}

/**
 * Public-Safe Member representation.
 * Explicitly EXCLUDES: phone, usn, user_id, role, rejection_reason, internal timestamps.
 */
export interface PublicMember {
  id: string;
  full_name: string;
  role: string;
  category: string;
  category_label: string;
  display_order: number;
  department?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  branch?: string | null;
  year?: string | null;
  joining_year?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  portfolio_url?: string | null;
  is_core: boolean;
}

export interface DbEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'technical' | 'competition' | 'workshop' | 'outreach' | 'cultural' | 'talk' | string;
  category_label: string;
  status: ContentStatus;
  timeline_status: 'completed' | 'upcoming' | 'ongoing' | 'postponed';
  event_date: string;
  formatted_date?: string | null;
  event_time?: string | null;
  date?: string;
  time?: string;
  location?: string | null;
  poster_url: string;
  registration_open: boolean;
  registration_link?: string | null;
  highlights?: string[] | null;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbGalleryImage {
  id: string;
  album_id?: string | null;
  title: string;
  event_name: string;
  date_str: string;
  category: string;
  image_url: string;
  caption?: string | null;
  alt_text?: string | null;
  display_order: number;
  status: ContentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DbGalleryAlbum {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  event_id?: string | null;
  display_order: number;
  status: ContentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DbInvitation {
  id: string;
  email: string;
  name: string;
  token_hash: string;
  designation_id?: string | null;
  expires_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  invited_by?: string | null;
  created_at: string;
  designation?: DbDesignation | null;
}

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'MEMBER_PERMANENTLY_DELETED'
  | 'MEMBER_APPROVED'
  | 'MEMBER_REJECTED'
  | 'MEMBER_REVOKED'
  | 'MEMBER_UPDATED'
  | 'INVITATION_CREATED'
  | 'INVITATION_REVOKED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'GALLERY_CREATED'
  | 'GALLERY_DELETED'
  | 'DESIGNATION_CREATED'
  | 'DESIGNATION_UPDATED'
  | 'DESIGNATION_DELETED'
  | string;

export interface DbAuditLog {
  id: string;
  action: AuditAction;
  actor_id?: string | null;
  actor_email: string;
  actor_name?: string | null;
  actor_role?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  target_email?: string | null;
  target_type?: 'member' | 'event' | 'gallery' | 'designation' | 'invitation' | 'session' | 'avatar' | 'auth' | string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      designations: {
        Row: {
          id: string
          name: string
          category: string
          category_label: string
          display_order: number
          description: string | null
          is_core: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          category_label: string
          display_order?: number
          description?: string | null
          is_core?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          category_label?: string
          display_order?: number
          description?: string | null
          is_core?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          usn: string | null
          branch: string | null
          year: string | null
          joining_year: string | null
          designation_id: string | null
          custom_role_text: string | null
          department: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          github_url: string | null
          linkedin_url: string | null
          instagram_url: string | null
          portfolio_url: string | null
          status: MemberStatus
          role: UserRole
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          usn?: string | null
          branch?: string | null
          year?: string | null
          joining_year?: string | null
          designation_id?: string | null
          custom_role_text?: string | null
          department?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          instagram_url?: string | null
          portfolio_url?: string | null
          status?: MemberStatus
          role?: UserRole
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          usn?: string | null
          branch?: string | null
          year?: string | null
          joining_year?: string | null
          designation_id?: string | null
          custom_role_text?: string | null
          department?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          instagram_url?: string | null
          portfolio_url?: string | null
          status?: MemberStatus
          role?: UserRole
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          category: string
          category_label: string
          status: ContentStatus
          timeline_status: 'completed' | 'upcoming' | 'ongoing' | 'postponed'
          event_date: string
          formatted_date: string | null
          event_time: string | null
          location: string | null
          poster_url: string
          registration_open: boolean
          registration_link: string | null
          highlights: string[] | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          category: string
          category_label: string
          status?: ContentStatus
          timeline_status?: 'completed' | 'upcoming' | 'ongoing' | 'postponed'
          event_date: string
          formatted_date?: string | null
          event_time?: string | null
          location?: string | null
          poster_url?: string
          registration_open?: boolean
          registration_link?: string | null
          highlights?: string[] | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          category?: string
          category_label?: string
          status?: ContentStatus
          timeline_status?: 'completed' | 'upcoming' | 'ongoing' | 'postponed'
          event_date?: string
          formatted_date?: string | null
          event_time?: string | null
          location?: string | null
          poster_url?: string
          registration_open?: boolean
          registration_link?: string | null
          highlights?: string[] | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image_url: string | null
          event_id: string | null
          display_order: number
          status: ContentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          event_id?: string | null
          display_order?: number
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          event_id?: string | null
          display_order?: number
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          id: string
          album_id: string | null
          title: string
          event_name: string
          date_str: string | null
          category: string
          image_url: string
          caption: string | null
          alt_text: string | null
          display_order: number
          status: ContentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          album_id?: string | null
          title: string
          event_name: string
          date_str?: string | null
          category?: string
          image_url: string
          caption?: string | null
          alt_text?: string | null
          display_order?: number
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          album_id?: string | null
          title?: string
          event_name?: string
          date_str?: string | null
          category?: string
          image_url?: string
          caption?: string | null
          alt_text?: string | null
          display_order?: number
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          email: string
          name: string
          token_hash: string
          designation_id: string | null
          expires_at: string
          accepted_at: string | null
          revoked_at: string | null
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          token_hash: string
          designation_id?: string | null
          expires_at: string
          accepted_at?: string | null
          revoked_at?: string | null
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          token_hash?: string
          designation_id?: string | null
          expires_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
          invited_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          actor_id: string | null
          actor_email: string
          actor_name: string | null
          actor_role: string | null
          target_id: string | null
          target_name: string | null
          target_email: string | null
          target_type: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          actor_id?: string | null
          actor_email: string
          actor_name?: string | null
          actor_role?: string | null
          target_id?: string | null
          target_name?: string | null
          target_email?: string | null
          target_type?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          actor_id?: string | null
          actor_email?: string
          actor_name?: string | null
          actor_role?: string | null
          target_id?: string | null
          target_name?: string | null
          target_email?: string | null
          target_type?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      member_status: MemberStatus
      user_role: UserRole
      content_status: ContentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

