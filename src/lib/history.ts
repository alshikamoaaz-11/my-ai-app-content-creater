import type { LinkPreview } from "@/lib/scrape";

export type WorkspaceMode = "form" | "link" | "campaign";

export type FormInputs = {
  category: string;
  partner: string;
  mechanic: string;
  detail: string;
  link: string;
};

/** One labelled variant produced by the bulk-campaign workspace. */
export type CampaignDraft = {
  label: string;
  draft: string;
  mandatoryHashtags: string[];
  suggestedHashtags: string[];
};

export type HistoryItem = {
  id: string;
  ts: number;
  mode: WorkspaceMode;
  /** Short human label shown in the sidebar list. */
  title: string;
  form?: FormInputs;
  /** Source URL for the link→post workspace. */
  url?: string;
  draft: string;
  preview: LinkPreview | null;
  suggestedHashtags: string[];
};

/** Active, in-progress workspace snapshot (restored on refresh / tab switch). */
export type WorkspaceSnapshot = {
  mode: WorkspaceMode;
  form: FormInputs;
  url: string;
  campaignBrief: string;
  campaignDrafts: CampaignDraft[];
  draft: string;
  preview: LinkPreview | null;
  suggestedHashtags: string[];
};

export const WORKSPACE_KEY = "anb.workspace.v1";
export const HISTORY_KEY = "anb.history.v1";
export const HISTORY_LIMIT = 30;

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled storage — non-fatal */
  }
}

/** Build a concise sidebar label from a draft or its inputs. */
export function deriveTitle(source: string): string {
  const firstLine = source.trim().split("\n")[0] ?? "";
  const trimmed = firstLine.replace(/\s+/g, " ").trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || "مسودة";
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
