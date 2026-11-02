export interface Whiteboard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  elements?: Record<string, unknown>[];
  app_state?: Record<string, unknown>;
  thumbnail_url: string | null;
  is_favorite: boolean;
  files?: Record<string, unknown> | unknown[];
  created_at: string;
  updated_at: string;
}

export type WhiteboardMetadata = Omit<Whiteboard, "elements" | "app_state" | "files"> & {
  elements?: Record<string, unknown>[];
  app_state?: Record<string, unknown>;
  files?: Record<string, unknown> | unknown[];
};

export type WhiteboardInsert = Omit<Whiteboard, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WhiteboardUpdate = Partial<Omit<Whiteboard, "id" | "user_id" | "created_at" | "updated_at">>;

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
  }
}
