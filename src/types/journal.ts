export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_urls: string[] | null;
  audio_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryInsert {
  user_id: string;
  title: string;
  content?: string | null;
  image_urls?: string[] | null;
  audio_url?: string | null;
  tags?: string[] | null;
}

export interface JournalEntryUpdate {
  title?: string;
  content?: string | null;
  image_urls?: string[] | null;
  audio_url?: string | null;
  tags?: string[] | null;
}
