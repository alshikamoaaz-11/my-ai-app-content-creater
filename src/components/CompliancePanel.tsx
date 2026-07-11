"use client";

import { useState } from "react";
import type { ComplianceResult, ComplianceWorkspace } from "@/lib/compliance";

type ReviewStatus = "idle" | "loading" | "success" | "error";

const STATUS_META: Record<
  ComplianceResult["status"],
  { label: string; badge: string; dot: string }
> = {
  pass: {
    label: "متوافق",
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  review: {
    label: "يحتاج مراجعة",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  warning: {
    label: "تحذير",
    badge: "bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
};

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-anb-navy">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-xs leading-6 text-slate-600"
          >
            <span aria-hidden className="mt-1 text-anb-blue">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Manual, on-demand AI compliance review for one draft. Self-contained: owns
 * its own request state, so each instance (including each campaign variation)
 * reviews independently. Hidden until the user explicitly requests a review.
 */
export default function CompliancePanel({
  draft,
  workspace,
}: {
  draft: string;
  workspace: ComplianceWorkspace;
}) {
  const [status, setStatus] = useState<ReviewStatus>("idle");
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/compliance-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, workspace }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "تعذّر إجراء مراجعة الامتثال");
        return;
      }
      setResult(data as ComplianceResult);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    }
  }

  const hasPanel = status !== "idle";

  return (
    <div className="mt-4 border-t border-anb-line pt-4">
      <button
        type="button"
        onClick={runReview}
        disabled={status === "loading" || !draft}
        className="rounded-xl border border-anb-line px-3.5 py-2 text-xs font-semibold text-anb-navy transition hover:border-anb-blue hover:bg-anb-blue-pale disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-anb-line disabled:hover:bg-transparent"
      >
        {status === "loading"
          ? "جاري المراجعة..."
          : status === "success"
            ? "🛡 إعادة مراجعة الامتثال"
            : "🛡 مراجعة الامتثال"}
      </button>

      {hasPanel && (
        <div className="mt-3 rounded-xl border border-anb-line bg-anb-blue-pale/20 p-4">
          {status === "error" && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {status === "loading" && !result && (
            <p className="text-xs text-slate-400">جاري تحليل المسودة...</p>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    درجة الامتثال
                  </p>
                  <p className="text-2xl font-bold text-anb-navy">
                    {result.score}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / 100
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    الحالة
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[result.status].badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_META[result.status].dot}`}
                    />
                    {STATUS_META[result.status].label}
                  </span>
                </div>
              </div>

              <Section title="التحذيرات" items={result.warnings} />
              <Section title="الاقتراحات" items={result.suggestions} />
              <Section
                title="الإخلاءات المطلوبة"
                items={result.requiredDisclaimers}
              />

              {result.warnings.length === 0 &&
                result.suggestions.length === 0 &&
                result.requiredDisclaimers.length === 0 && (
                  <p className="text-xs text-slate-500">
                    لا توجد ملاحظات امتثال على هذه المسودة.
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
