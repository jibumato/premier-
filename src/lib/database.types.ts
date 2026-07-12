/**
 * Supabase database types for the Phase 1 schema.
 *
 * Hand-authored to mirror `supabase/migrations/0001_phase1_core.sql`. Once a
 * Supabase project exists, regenerate the canonical version with:
 *
 *   supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 *
 * (or `--local` against a local stack). Keep this file in sync with migrations.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "layer" | "photographer" | "both";
export type AwaseStatus = "open" | "closed";
export type AwaseRoleStatus = "confirmed" | "open";
export type ApplicationStatus = "applied" | "accepted" | "rejected" | "done";
export type NotificationType = "application" | "follow" | "like" | "badge" | "message";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          role: UserRole;
          bio: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          meister_title: string | null;
          is_verified: boolean;
          is_age_verified: boolean;
          is_private: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          role?: UserRole;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          meister_title?: string | null;
          is_verified?: boolean;
          is_age_verified?: boolean;
          is_private?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      works: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["works"]["Insert"]>;
        Relationships: [];
      };
      work_follows: {
        Row: { user_id: string; work_id: string };
        Insert: { user_id: string; work_id: string };
        Update: Partial<{ user_id: string; work_id: string }>;
        Relationships: [];
      };
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string };
        Insert: { follower_id: string; followee_id: string; created_at?: string };
        Update: Partial<{ follower_id: string; followee_id: string; created_at: string }>;
        Relationships: [];
      };
      awase: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          work_id: string | null;
          world_tags: string[];
          event_date: string;
          place: string | null;
          region: string;
          fee_text: string | null;
          body: string | null;
          women_only: boolean;
          beginner_ok: boolean;
          capacity: number | null;
          status: AwaseStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          work_id?: string | null;
          world_tags?: string[];
          event_date: string;
          place?: string | null;
          region: string;
          fee_text?: string | null;
          body?: string | null;
          women_only?: boolean;
          beginner_ok?: boolean;
          capacity?: number | null;
          status?: AwaseStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase"]["Insert"]>;
        Relationships: [];
      };
      awase_images: {
        Row: { id: string; awase_id: string; storage_path: string; sort: number };
        Insert: { id?: string; awase_id: string; storage_path: string; sort?: number };
        Update: Partial<Database["public"]["Tables"]["awase_images"]["Insert"]>;
        Relationships: [];
      };
      awase_roles: {
        Row: {
          id: string;
          awase_id: string;
          char_name: string;
          assignee_id: string | null;
          status: AwaseRoleStatus;
          sort: number;
        };
        Insert: {
          id?: string;
          awase_id: string;
          char_name: string;
          assignee_id?: string | null;
          status?: AwaseRoleStatus;
          sort?: number;
        };
        Update: Partial<Database["public"]["Tables"]["awase_roles"]["Insert"]>;
        Relationships: [];
      };
      awase_applications: {
        Row: {
          id: string;
          awase_id: string;
          applicant_id: string;
          role_id: string | null;
          message: string | null;
          status: ApplicationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          awase_id: string;
          applicant_id: string;
          role_id?: string | null;
          message?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase_applications"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: { id: string; awase_id: string | null; created_at: string };
        Insert: { id?: string; awase_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      conversation_members: {
        Row: { conversation_id: string; user_id: string; last_read_at: string };
        Insert: { conversation_id: string; user_id: string; last_read_at?: string };
        Update: Partial<{ conversation_id: string; user_id: string; last_read_at: string }>;
        Relationships: [];
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };
        Insert: { id?: string; conversation_id: string; sender_id: string; body: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          actor_id: string | null;
          entity_id: string | null;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          actor_id?: string | null;
          entity_id?: string | null;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          author_id: string;
          target_id: string;
          awase_id: string | null;
          rating: number;
          good_points: string[];
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          target_id: string;
          awase_id?: string | null;
          rating: number;
          good_points?: string[];
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          image_url: string;
          caption: string | null;
          sort: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          image_url: string;
          caption?: string | null;
          sort?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      qa_questions: {
        Row: { id: string; author_id: string; title: string; body: string; tag: string; created_at: string };
        Insert: { id?: string; author_id: string; title: string; body: string; tag?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["qa_questions"]["Insert"]>;
        Relationships: [];
      };
      qa_answers: {
        Row: {
          id: string;
          question_id: string;
          author_id: string;
          body: string;
          is_best: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          author_id: string;
          body: string;
          is_best?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qa_answers"]["Insert"]>;
        Relationships: [];
      };
      qa_answer_likes: {
        Row: { answer_id: string; user_id: string; created_at: string };
        Insert: { answer_id: string; user_id: string; created_at?: string };
        Update: Partial<{ answer_id: string; user_id: string; created_at: string }>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          event_date: string;
          venue: string;
          region: string;
          tag: string;
          fee_text: string | null;
          body: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_date: string;
          venue: string;
          region: string;
          tag?: string;
          fee_text?: string | null;
          body?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      event_rsvps: {
        Row: { event_id: string; user_id: string; created_at: string };
        Insert: { event_id: string; user_id: string; created_at?: string };
        Update: Partial<{ event_id: string; user_id: string; created_at: string }>;
        Relationships: [];
      };
      market_items: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          work_id: string | null;
          price: number;
          size: string;
          item_condition: string;
          shipping: string | null;
          body: string | null;
          image_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          work_id?: string | null;
          price: number;
          size?: string;
          item_condition?: string;
          shipping?: string | null;
          body?: string | null;
          image_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["market_items"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          detail?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: Partial<{ blocker_id: string; blocked_id: string; created_at: string }>;
        Relationships: [];
      };
      content_flags: {
        Row: {
          target_type: string;
          target_id: string;
          auto_hidden: boolean;
          report_count: number;
          flagged_at: string;
        };
        Insert: {
          target_type: string;
          target_id: string;
          auto_hidden?: boolean;
          report_count?: number;
          flagged_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_flags"]["Insert"]>;
        Relationships: [];
      };
      corporate_leads: {
        Row: {
          id: string;
          company: string;
          email: string;
          plan: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company: string;
          email: string;
          plan?: string | null;
          message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["corporate_leads"]["Insert"]>;
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          doc_url: string;
          status: string;
          note: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          doc_url: string;
          status?: string;
          note?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["verification_requests"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          category: string;
          title: string;
          body: string;
          published_at: string;
        };
        Insert: {
          id?: string;
          category?: string;
          title: string;
          body?: string;
          published_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      find_direct_conversation: {
        Args: { user_a: string; user_b: string };
        Returns: string | null;
      };
      has_confirmed_participation: {
        Args: { p_author: string; p_target: string; p_awase: string | null };
        Returns: boolean;
      };
      mark_best_answer: {
        Args: { p_answer_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      awase_status: AwaseStatus;
      awase_role_status: AwaseRoleStatus;
      application_status: ApplicationStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<never, never>;
  };
}

/** Convenience helpers: `Tables<"awase">`, `InsertOf<"awase">`. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertOf<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateOf<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
