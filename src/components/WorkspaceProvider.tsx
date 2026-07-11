"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CATEGORIES, MECHANICS } from "@/lib/categories";
import type { LinkPreview } from "@/lib/scrape";
import {
  deriveTitle,
  HISTORY_KEY,
  HISTORY_LIMIT,
  loadJSON,
  makeId,
  saveJSON,
  WORKSPACE_KEY,
  type CampaignDraft,
  type FormInputs,
  type HistoryItem,
  type WorkspaceMode,
  type WorkspaceSnapshot,
} from "@/lib/history";

type Status = "idle" | "loading" | "success" | "error";

const DEFAULT_FORM: FormInputs = {
  category: CATEGORIES[0].value,
  partner: "",
  mechanic: MECHANICS[0].value,
  detail: "",
  link: "",
};

type WorkspaceContextValue = {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;

  form: FormInputs;
  setFormField: (field: keyof FormInputs, value: string) => void;

  url: string;
  setUrl: (value: string) => void;

  campaignBrief: string;
  setCampaignBrief: (value: string) => void;
  campaignDrafts: CampaignDraft[];

  draft: string;
  preview: LinkPreview | null;
  status: Status;
  error: string | null;

  history: HistoryItem[];
  generateForm: () => Promise<void>;
  generateLink: () => Promise<void>;
  generateCampaign: () => Promise<void>;
  clearDraft: () => void;
  restore: (item: HistoryItem) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

export default function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<WorkspaceMode>("form");
  const [form, setForm] = useState<FormInputs>(DEFAULT_FORM);
  const [url, setUrl] = useState("");
  const [campaignBrief, setCampaignBrief] = useState("");
  const [campaignDrafts, setCampaignDrafts] = useState<CampaignDraft[]>([]);
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const hydrated = useRef(false);

  // Restore persisted workspace + history on first client render.
  useEffect(() => {
    const snap = loadJSON<WorkspaceSnapshot | null>(WORKSPACE_KEY, null);
    if (snap) {
      setMode(snap.mode ?? "form");
      setForm({ ...DEFAULT_FORM, ...(snap.form ?? {}) });
      setUrl(snap.url ?? "");
      setCampaignBrief(snap.campaignBrief ?? "");
      setCampaignDrafts(snap.campaignDrafts ?? []);
      setDraft(snap.draft ?? "");
      setPreview(snap.preview ?? null);
      if (snap.draft || (snap.campaignDrafts?.length ?? 0) > 0) setStatus("success");
    }
    setHistory(loadJSON<HistoryItem[]>(HISTORY_KEY, []));
    hydrated.current = true;
  }, []);

  // Persist the active workspace whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    const snapshot: WorkspaceSnapshot = {
      mode,
      form,
      url,
      campaignBrief,
      campaignDrafts,
      draft,
      preview,
    };
    saveJSON(WORKSPACE_KEY, snapshot);
  }, [mode, form, url, campaignBrief, campaignDrafts, draft, preview]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveJSON(HISTORY_KEY, history);
  }, [history]);

  const setFormField = useCallback((field: keyof FormInputs, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const pushHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, HISTORY_LIMIT));
  }, []);

  const generateForm = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "حدث خطأ أثناء إنشاء المسودة");
        return;
      }
      const nextPreview: LinkPreview | null = data.preview ?? null;
      setDraft(data.draft);
      setPreview(nextPreview);
      setStatus("success");
      pushHistory({
        id: makeId(),
        ts: Date.now(),
        mode: "form",
        title: deriveTitle(data.draft),
        form: { ...form },
        draft: data.draft,
        preview: nextPreview,
      });
    } catch {
      setStatus("error");
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    }
  }, [form, pushHistory]);

  const generateLink = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "حدث خطأ أثناء إنشاء المسودة");
        return;
      }
      const nextPreview: LinkPreview | null = data.preview ?? null;
      setDraft(data.draft);
      setPreview(nextPreview);
      setStatus("success");
      pushHistory({
        id: makeId(),
        ts: Date.now(),
        mode: "link",
        title: deriveTitle(data.draft),
        url,
        draft: data.draft,
        preview: nextPreview,
      });
    } catch {
      setStatus("error");
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    }
  }, [url, pushHistory]);

  const generateCampaign = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: campaignBrief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "حدث خطأ أثناء إنشاء المسودات");
        return;
      }
      setCampaignDrafts(data.drafts ?? []);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    }
  }, [campaignBrief]);

  const restore = useCallback((item: HistoryItem) => {
    setMode(item.mode);
    if (item.mode === "form" && item.form) {
      setForm({ ...DEFAULT_FORM, ...item.form });
    }
    if (item.mode === "link") {
      setUrl(item.url ?? "");
    }
    setDraft(item.draft);
    setPreview(item.preview);
    setStatus("success");
    setError(null);
  }, []);

  // Clears all generated output (single draft, its preview, campaign drafts) and
  // resets generation status. History and input fields are left untouched.
  const clearDraft = useCallback(() => {
    setDraft("");
    setPreview(null);
    setCampaignDrafts([]);
    setStatus("idle");
    setError(null);
  }, []);

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const value: WorkspaceContextValue = {
    mode,
    setMode,
    form,
    setFormField,
    url,
    setUrl,
    campaignBrief,
    setCampaignBrief,
    campaignDrafts,
    draft,
    preview,
    status,
    error,
    history,
    generateForm,
    generateLink,
    generateCampaign,
    clearDraft,
    restore,
    removeHistory,
    clearHistory,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
