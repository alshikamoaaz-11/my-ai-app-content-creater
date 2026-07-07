"use client";

import { useState } from "react";
import { CATEGORIES, MECHANICS } from "@/lib/categories";

type Status = "idle" | "loading" | "success" | "error";

const fieldLabel = "mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy";
const fieldClass = "anb-field w-full rounded-xl px-3.5 py-2.5 text-sm text-anb-ink";

export default function DraftForm() {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [partner, setPartner] = useState("");
  const [mechanic, setMechanic] = useState(MECHANICS[0].value);
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");

  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, partner, mechanic, detail, link }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "حدث خطأ أثناء إنشاء المسودة");
        return;
      }

      setDraft(data.draft);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="anb-card space-y-4 p-6 sm:p-7">
        <div>
          <label className={fieldLabel}>الفئة</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            placeholder='مثال: "نون"'
            className={fieldClass}
          />
        </div>

        <div>
          <label className={fieldLabel}>آلية المكافأة</label>
          <select
            value={mechanic}
            onChange={(e) => setMechanic(e.target.value)}
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
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="مثال: خصم 20% أو استرداد نقدي 5%"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            الرابط{" "}
            <span className="font-normal text-slate-400">(اختياري)</span>
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-anb-navy">
            المسودة
          </h2>
          {status === "success" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-anb-blue-pale px-3 py-1 text-xs font-semibold text-anb-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-anb-blue" />
              تم إنشاء المسودة
            </span>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <textarea
          readOnly
          value={draft}
          placeholder="ستظهر المسودة هنا بعد الإنشاء..."
          dir="rtl"
          className="min-h-[220px] flex-1 resize-none rounded-xl border border-anb-line bg-anb-blue-pale/30 p-4 text-sm leading-7 text-anb-navy-dark focus:outline-none"
        />

        <button
          type="button"
          onClick={handleCopy}
          disabled={!draft}
          className="mt-4 w-full rounded-xl border-2 border-anb-blue px-4 py-2.5 text-sm font-semibold text-anb-blue transition hover:bg-anb-blue-pale disabled:opacity-40"
        >
          {copied ? "تم النسخ ✓" : "نسخ المسودة"}
        </button>
      </div>
    </div>
  );
}
