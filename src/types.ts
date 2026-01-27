export type EventType = "internal" | "external";

export interface EventListItem {
  category: string;
  club: string;
  description: string;
  end_date: string;
  featured: boolean;
  image: string;
  name: string;
  on_hold: boolean;
  is_registrable: boolean;
  pid: string; // e.g., evt_... (event code)
  price_per_ticket: number;
  start_date: string;
  team_size: string;
  total_prize: string;
  venues: string[];
}

export interface EventListResponse {
  events: EventListItem[];
}

export interface EventSlotDetail {
  end_date: string;
  start_date: string;
  venue: string;
}

export interface EventDetail {
  category: string;
  club: string;
  coordinator1_email?: string;
  coordinator1_phone?: string;
  description: string; // markdown
  event_type: EventType | string;
  featured: boolean;
  image: string;
  is_a_team_event: boolean;
  is_registrable: boolean;
  judgement_criteria?: string;
  name: string;
  number_of_participants?: string;
  pid: string; // sometimes numeric
  price_per_ticket: number;
  prizes?: string;
  rules?: string;
  short_description?: string;
  slot_details: EventSlotDetail[];
}
