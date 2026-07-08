"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function ChatForm() {
  const { topic, setTopic, draft, status, error, generateChat } = useWorkspace();
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCopied(false);
    await generateChat();
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
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy">
            اكتب موضوع التغريدة بكلماتك
          </label>
          <p className="mb-2 text-xs text-slate-400">
            مثال: &laquo;عرض كاش باك 10% مع نون على الطلبات فوق 200 ريال&raquo; —
            سيختار المساعد القالب المناسب تلقائيًا.
          </p>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            rows={8}
            dir="rtl"
            placeholder="اكتب هنا ماذا تريد أن تنشئ..."
            className="anb-field w-full resize-none rounded-xl px-3.5 py-2.5 text-sm leading-7 text-anb-ink"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !topic.trim()}
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
