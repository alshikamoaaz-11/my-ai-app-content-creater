"use client";

import { useState } from "react";
import ActionButton from "@/components/ActionButton";
import XPostPreview from "@/components/XPostPreview";
import HashtagChips from "@/components/HashtagChips";
import CompliancePanel from "@/components/CompliancePanel";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  IconCheck,
  IconCopy,
  IconRefresh,
  IconSpinner,
  IconTrash,
} from "@/components/icons";

const fieldLabel = "mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy";
const fieldClass = "anb-field w-full rounded-lg px-3.5 py-2.5 text-sm text-anb-ink";

export default function LinkForm() {
  const {
    url,
    setUrl,
    draft,
    preview,
    suggestedHashtags,
    mandatoryHashtags,
    status,
    error,
    generateLink,
    clearDraft,
  } = useWorkspace();
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCopied(false);
    await generateLink();
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setCopied(false);
    await generateLink();
  }

  function handleClear() {
    setCopied(false);
    clearDraft();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="anb-card space-y-5 p-7 sm:p-8">
          <div>
            <label className={fieldLabel}>رابط الصفحة</label>
            <p className="mb-2 text-xs text-slate-400">
              نقرأ عنوان الصفحة وصورتها فقط (بدون محتوى المقال) لصياغة منشور بأسلوب anb.
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              dir="ltr"
              placeholder="https://..."
              className={`${fieldClass} text-left`}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !url.trim()}
            className="anb-btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold text-anb-white disabled:opacity-60"
          >
            {status === "loading" ? (
              <span className="inline-flex items-center justify-center gap-2">
                <IconSpinner />
                جاري الإنشاء...
              </span>
            ) : (
              "حوّل الرابط إلى منشور"
            )}
          </button>
        </form>

        {/* Large visual preview of the fetched page (og:image + og:title). */}
        {preview && (
          <div className="anb-card overflow-hidden">
            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.image}
                alt=""
                className="h-52 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="space-y-1 p-5">
              <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">
                {preview.siteName ?? preview.url}
              </p>
              <p className="text-base font-bold leading-6 text-anb-navy-dark">
                {preview.title}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="anb-card flex flex-col p-7 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold tracking-wide text-anb-navy">المسودة</h2>
          <div className="flex items-center gap-2">
            {status === "success" && draft && (
              <span className="hidden items-center gap-1.5 rounded-full bg-anb-blue-pale px-3 py-1 text-xs font-semibold text-anb-blue sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-anb-blue" />
                تم إنشاء المسودة
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <ActionButton
                icon={copied ? <IconCheck /> : <IconCopy />}
                label="نسخ المسودة"
                onClick={handleCopy}
                disabled={!draft}
              />
              <ActionButton
                icon={<IconRefresh />}
                label="إعادة التوليد"
                onClick={handleRegenerate}
                disabled={status === "loading" || !url.trim()}
              />
              <ActionButton
                icon={<IconTrash />}
                label="مسح المسودة"
                onClick={handleClear}
                disabled={status === "loading" || (!draft && !preview && !error)}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <XPostPreview draft={draft} preview={preview} />

        {draft && (
          <>
            <HashtagChips
              title="الهاشتاقات الإلزامية"
              hashtags={[...mandatoryHashtags]}
            />
            <HashtagChips
              title="الهاشتاقات المقترحة"
              hashtags={suggestedHashtags}
            />
            <CompliancePanel draft={draft} workspace="link" />
          </>
        )}
      </div>
    </div>
  );
}
