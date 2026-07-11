"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, MECHANICS } from "@/lib/categories";
import ActionButton from "@/components/ActionButton";
import XPostPreview from "@/components/XPostPreview";
import HashtagChips from "@/components/HashtagChips";
import CompliancePanel from "@/components/CompliancePanel";
import { useWorkspace } from "@/components/WorkspaceProvider";

const fieldLabel = "mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy";
const fieldClass = "anb-field w-full rounded-xl px-3.5 py-2.5 text-sm text-anb-ink";

/** Greeting category: swap the reward/discount fields for a single occasion field. */
const HOLIDAY_CATEGORY = "holiday_greeting";

export default function DraftForm() {
  const {
    form,
    setFormField,
    draft,
    preview,
    suggestedHashtags,
    mandatoryHashtags,
    status,
    error,
    generateForm,
    clearDraft,
  } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const isHoliday = form.category === HOLIDAY_CATEGORY;

  // In greeting mode there is no reward mechanic; force it to "none" so the
  // prompt omits the mechanic line (generation logic itself is unchanged).
  useEffect(() => {
    if (isHoliday && form.mechanic !== "none") {
      setFormField("mechanic", "none");
    }
  }, [isHoliday, form.mechanic, setFormField]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCopied(false);
    await generateForm();
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    // Reruns generateForm with the current workspace state (unchanged form
    // inputs); replaces the current draft with the new result.
    setCopied(false);
    await generateForm();
  }

  function handleClear() {
    setCopied(false);
    clearDraft();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="anb-card space-y-4 p-6 sm:p-7">
        <div>
          <label className={fieldLabel}>الفئة</label>
          <select
            value={form.category}
            onChange={(e) => setFormField("category", e.target.value)}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel}>
            الشريك / البراند{" "}
            <span className="font-normal text-slate-400">(اختياري)</span>
          </label>
          <input
            type="text"
            value={form.partner}
            onChange={(e) => setFormField("partner", e.target.value)}
            placeholder='مثال: "نون"'
            className={fieldClass}
          />
        </div>

        {isHoliday ? (
          <div>
            <label className={fieldLabel}>المناسبة / السياق</label>
            <input
              type="text"
              value={form.detail}
              onChange={(e) => setFormField("detail", e.target.value)}
              placeholder="مثال: عيد الأضحى، اليوم الوطني، شهر رمضان"
              className={fieldClass}
            />
          </div>
        ) : (
          <>
            <div>
              <label className={fieldLabel}>آلية المكافأة</label>
              <select
                value={form.mechanic}
                onChange={(e) => setFormField("mechanic", e.target.value)}
                className={fieldClass}
              >
                {MECHANICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={fieldLabel}>نسبة الخصم / التفاصيل</label>
              <input
                type="text"
                value={form.detail}
                onChange={(e) => setFormField("detail", e.target.value)}
                placeholder="مثال: خصم 20% أو استرداد نقدي 5%"
                className={fieldClass}
              />
            </div>
          </>
        )}

        <div>
          <label className={fieldLabel}>
            الرابط{" "}
            <span className="font-normal text-slate-400">(اختياري)</span>
          </label>
          <input
            type="text"
            value={form.link}
            onChange={(e) => setFormField("link", e.target.value)}
            placeholder="https://..."
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="anb-btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-anb-white disabled:opacity-60"
        >
          {status === "loading" ? "جاري الإنشاء..." : "إنشاء المسودة"}
        </button>
      </form>

      <div className="anb-card flex flex-col p-6 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold tracking-wide text-anb-navy">
            المسودة
          </h2>
          <div className="flex items-center gap-2">
            {status === "success" && (
              <span className="hidden items-center gap-1.5 rounded-full bg-anb-blue-pale px-3 py-1 text-xs font-semibold text-anb-blue sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-anb-blue" />
                تم إنشاء المسودة
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <ActionButton
                icon={copied ? "✅" : "📋"}
                label="نسخ المسودة"
                onClick={handleCopy}
                disabled={!draft}
              />
              <ActionButton
                icon="🔄"
                label="إعادة التوليد"
                onClick={handleRegenerate}
                disabled={status === "loading"}
              />
              <ActionButton
                icon="🗑"
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
            <CompliancePanel draft={draft} workspace="form" />
          </>
        )}
      </div>
    </div>
  );
}
