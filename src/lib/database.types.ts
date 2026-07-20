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
export type NotificationType = "application" | "follow" | "like" | "badge" | "message" | "post" | "event_appearance";

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
          is_admin: boolean;
          is_suspended: boolean;
          suspension_reason: string | null;
          suspended_at: string | null;
          x_handle: string | null;
          searchable_by_name: boolean;
          handle_changed_at: string | null;
          notification_prefs: Record<string, boolean>;
          links: Json;
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
          is_admin?: boolean;
          is_suspended?: boolean;
          suspension_reason?: string | null;
          suspended_at?: string | null;
          x_handle?: string | null;
          searchable_by_name?: boolean;
          handle_changed_at?: string | null;
          notification_prefs?: Record<string, boolean>;
          links?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      works: {
        Row: { id: string; name: string; reading: string | null; created_at: string };
        Insert: { id?: string; name: string; reading?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["works"]["Insert"]>;
        Relationships: [];
      };
      work_follows: {
        Row: { user_id: string; work_id: string };
        Insert: { user_id: string; work_id: string };
        Update: Partial<{ user_id: string; work_id: string }>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          work_id: string | null;
          region: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string;
          work_id?: string | null;
          region?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: { group_id: string; user_id: string; role: string; joined_at: string };
        Insert: { group_id: string; user_id: string; role?: string; joined_at?: string };
        Update: Partial<{ group_id: string; user_id: string; role: string; joined_at: string }>;
        Relationships: [];
      };
      group_posts: {
        Row: { id: string; group_id: string; author_id: string; body: string; created_at: string };
        Insert: { id?: string; group_id: string; author_id: string; body: string; created_at?: string };
        Update: Partial<{ id: string; group_id: string; author_id: string; body: string; created_at: string }>;
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
          publish_at: string | null;
          application_deadline: string | null;
          accept_waitlist: boolean;
          view_count: number;
          event_id: string | null;
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
          publish_at?: string | null;
          application_deadline?: string | null;
          accept_waitlist?: boolean;
          event_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase"]["Insert"]>;
        Relationships: [];
      };
      awase_templates: {
        Row: {
          id: string;
          host_id: string;
          name: string;
          title: string;
          work_id: string | null;
          region: string;
          place: string | null;
          fee_text: string | null;
          body: string | null;
          capacity: number | null;
          women_only: boolean;
          beginner_ok: boolean;
          world_tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          name: string;
          title?: string;
          work_id?: string | null;
          region?: string;
          place?: string | null;
          fee_text?: string | null;
          body?: string | null;
          capacity?: number | null;
          women_only?: boolean;
          beginner_ok?: boolean;
          world_tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase_templates"]["Insert"]>;
        Relationships: [];
      };
      studios: {
        Row: {
          id: string;
          name: string;
          region: string;
          area_text: string;
          tags: string[];
          price_text: string | null;
          url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          region: string;
          area_text?: string;
          tags?: string[];
          price_text?: string | null;
          url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["studios"]["Insert"]>;
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
          attended: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          awase_id: string;
          applicant_id: string;
          role_id?: string | null;
          message?: string | null;
          status?: ApplicationStatus;
          attended?: boolean | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase_applications"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: { id: string; awase_id: string | null; is_group: boolean; title: string | null; created_at: string };
        Insert: { id?: string; awase_id?: string | null; is_group?: boolean; title?: string | null; created_at?: string };
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
        Row: { id: string; conversation_id: string; sender_id: string; body: string; image_url: string | null; created_at: string };
        Insert: { id?: string; conversation_id: string; sender_id: string; body: string; image_url?: string | null; created_at?: string };
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
          visibility: "public" | "awase";
          work_id: string | null;
          view_count: number;
          like_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          image_url: string;
          caption?: string | null;
          sort?: number;
          visibility?: "public" | "awase";
          work_id?: string | null;
          view_count?: number;
          like_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<{ post_id: string; user_id: string; created_at: string }>;
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
          starts_on: string | null;
          image_url: string | null;
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
          starts_on?: string | null;
          image_url?: string | null;
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
      event_interests: {
        Row: { event_id: string; user_id: string; created_at: string };
        Insert: { event_id: string; user_id: string; created_at?: string };
        Update: Partial<{ event_id: string; user_id: string; created_at: string }>;
        Relationships: [];
      };
      event_appearances: {
        Row: { event_id: string; user_id: string; note: string; created_at: string };
        Insert: { event_id: string; user_id: string; note?: string; created_at?: string };
        Update: Partial<{ event_id: string; user_id: string; note: string; created_at: string }>;
        Relationships: [];
      };
      event_reviews: {
        Row: {
          event_id: string;
          user_id: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          rating: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_reviews"]["Insert"]>;
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
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          category: string;
          body: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          category: string;
          body: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      lounge_posts: {
        Row: {
          id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lounge_posts"]["Insert"]>;
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
      home_pickups: {
        Row: {
          id: string;
          image_url: string;
          caption: string | null;
          sort: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string | null;
          sort?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_pickups"]["Insert"]>;
        Relationships: [];
      };
      awase_schedule_options: {
        Row: {
          id: string;
          awase_id: string;
          label: string;
          is_decided: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          awase_id: string;
          label: string;
          is_decided?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase_schedule_options"]["Insert"]>;
        Relationships: [];
      };
      awase_schedule_votes: {
        Row: {
          option_id: string;
          user_id: string;
          mark: string;
          updated_at: string;
        };
        Insert: {
          option_id: string;
          user_id: string;
          mark: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["awase_schedule_votes"]["Insert"]>;
        Relationships: [];
      };
      activity_events: {
        Row: { id: string; kind: string; headline: string; created_at: string };
        Insert: { id?: string; kind: string; headline: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["activity_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      trending_works: {
        Args: { p_days?: number; p_limit?: number };
        Returns: { work_id: string; name: string; awase_count: number }[];
      };
      set_attendance: {
        Args: { p_application: string; p_attended: boolean };
        Returns: undefined;
      };
      user_attendance_stats: {
        Args: { p_user: string };
        Returns: { attended_count: number; marked_count: number }[];
      };
      admin_search_profiles: {
        Args: { p_query: string; p_limit?: number };
        Returns: {
          id: string;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          is_verified: boolean;
          is_admin: boolean;
          is_suspended: boolean;
          suspension_reason: string | null;
          suspended_at: string | null;
          report_count: number;
        }[];
      };
      admin_list_user_reports: {
        Args: { p_user_id: string };
        Returns: {
          id: string;
          reporter_id: string;
          reporter_name: string;
          reason: string;
          detail: string | null;
          created_at: string;
        }[];
      };
      admin_suspend_user: {
        Args: { p_user_id: string; p_reason: string };
        Returns: undefined;
      };
      admin_reinstate_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      admin_list_user_conversations: {
        Args: { p_user_id: string };
        Returns: {
          conversation_id: string;
          other_user_id: string | null;
          other_user_name: string | null;
          message_count: number;
          last_message_at: string | null;
        }[];
      };
      admin_get_conversation_messages: {
        Args: { p_conversation_id: string; p_reason: string };
        Returns: {
          message_id: string;
          sender_id: string;
          sender_name: string;
          body: string;
          image_url: string | null;
          created_at: string;
        }[];
      };
      admin_list_message_access_log: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          admin_name: string | null;
          target_name: string | null;
          conversation_id: string | null;
          reason: string;
          accessed_at: string;
        }[];
      };
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
      increment_awase_view: {
        Args: { target: string };
        Returns: undefined;
      };
      increment_post_view: {
        Args: { target: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_list_pending_verifications: {
        Args: Record<string, never>;
        Returns: {
          request_id: string;
          user_id: string;
          display_name: string;
          handle: string;
          doc_url: string;
          created_at: string;
        }[];
      };
      admin_approve_verification: {
        Args: { p_request_id: string; p_age_verified?: boolean };
        Returns: undefined;
      };
      admin_reject_verification: {
        Args: { p_request_id: string; p_note?: string | null };
        Returns: undefined;
      };
      admin_delete_qa_question: {
        Args: { p_question_id: string };
        Returns: undefined;
      };
      admin_delete_lounge_post: {
        Args: { p_post_id: string };
        Returns: undefined;
      };
      admin_delete_qa_answer: {
        Args: { p_answer_id: string };
        Returns: undefined;
      };
      can_vote_awase_schedule: {
        Args: { p_awase: string };
        Returns: boolean;
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      is_conversation_member: {
        Args: { p_conversation: string; p_user: string };
        Returns: boolean;
      };
      create_direct_conversation: {
        Args: { p_other: string; p_awase?: string | null };
        Returns: string;
      };
      get_or_create_awase_group_chat: {
        Args: { p_awase: string };
        Returns: string;
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
