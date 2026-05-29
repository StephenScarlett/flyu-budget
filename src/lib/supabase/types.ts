export interface Trip {
  id: string;
  name: string;
  group_size: number;
  num_nights: number;
  destination: string;
  trip_start: string | null;
  trip_end: string | null;
  usd_to_ttd: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  trip_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  auth_user_id: string | null;
  is_single: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  trip_id: string;
  category: string;
  name: string;
  description: string | null;
  cost_usd: number;
  cost_type: "per_person" | "total_group" | "per_room" | "split_between";
  tier: string;
  source_label: string | null;
  source_url: string | null;
  sort_order: number;
  is_optional: boolean;
  is_included: boolean;
  member_ids: string[] | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  description: string | null;
  cost_note: string | null;
  sort_order: number;
}

export interface TripLink {
  id: string;
  trip_id: string;
  label: string;
  url: string;
  icon_name: string;
  sort_order: number;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: {
    type: string;
    table: string;
    data?: Record<string, unknown>;
    id?: string;
    description: string;
  } | null;
  actionStatus?: "pending" | "confirmed" | "cancelled" | "error";
}

export interface Chat {
  id: string;
  trip_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChangeLogEntry {
  id: string;
  trip_id: string;
  member_id: string | null;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

// Supabase Database type for generic client typing
export interface Database {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: Partial<Trip> & { name?: string };
        Update: Partial<Trip>;
      };
      members: {
        Row: Member;
        Insert: Partial<Member> & { name: string; trip_id: string };
        Update: Partial<Member>;
      };
      budget_items: {
        Row: BudgetItem;
        Insert: Partial<BudgetItem> & {
          trip_id: string;
          category: string;
          name: string;
        };
        Update: Partial<BudgetItem>;
      };
      itinerary: {
        Row: ItineraryDay;
        Insert: Partial<ItineraryDay> & {
          trip_id: string;
          day_number: number;
          title: string;
        };
        Update: Partial<ItineraryDay>;
      };
      change_log: {
        Row: ChangeLogEntry;
        Insert: Partial<ChangeLogEntry> & {
          trip_id: string;
          table_name: string;
          record_id: string;
          field_name: string;
        };
        Update: Partial<ChangeLogEntry>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
