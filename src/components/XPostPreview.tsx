"use client";

import type { LinkPreview } from "@/lib/scrape";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { IconDoc } from "@/components/icons";

/**
 * Presentational X/Twitter post preview for a generated draft. Renders the
 * draft the way X would display it — avatar, verified anb account, handle, a
 * timestamp placeholder, the post body with highlighted hashtags/mentions/links
 * and preserved line breaks, an optional link card, and a static (non-interactive)
 * action bar. This is display-only: it never mutates the draft or fires actions.
 */

const TOKEN_RE = /(#[\p{L}\p{N}_\p{M}]+|https?:\/\/\S+|@[A-Za-z0-9_]+)/gu;

/** Render post text with hashtags, @mentions and URLs in the X accent colour. */
function renderContent(text: string) {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^(#|@|https?:\/\/)/.test(part)) {
      return (
        <span key={i} className="text-anb-blue-bright">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[18px] w-[18px] shrink-0 text-anb-blue-bright"
      fill="currentColor"
    >
      <path d="M12 2l2.2 1.6 2.7-.3 1 2.5 2.4 1.2-.3 2.7L23 12l-1.6 2.2.3 2.7-2.5 1-1.2 2.4-2.7-.3L12 22l-2.2-1.6-2.7.3-1-2.5L3.7 17l.3-2.7L2 12l1.6-2.2-.3-2.7 2.5-1 1.2-2.4 2.7.3z" />
      <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3.3-3.3 1.1 1.1z" fill="#fff" />
    </svg>
  );
}

function ActionBarIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default function XPostPreview({
  draft,
  preview,
}: {
  draft: string;
  preview: LinkPreview | null;
}) {
  if (!draft) {
    return (
      <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-anb-line bg-slate-50/60 p-6 text-center">
        <IconDoc className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-400">
          ستظهر معاينة المنشور هنا بعد الإنشاء...
        </p>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="anb-fade-in flex-1 rounded-xl border border-anb-line bg-anb-white p-4"
    >
      {/* Header: avatar + identity + timestamp placeholder */}
      <div className="flex items-start gap-3">
        <div className="anb-navy-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold tracking-wide text-anb-white shadow-md">
          anb
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 leading-tight">
            <span className="font-bold text-anb-navy-dark">البنك العربي الوطني</span>
            <VerifiedBadge />
            <span className="text-sm text-slate-500">@anb</span>
            <span className="text-sm text-slate-400">· الآن</span>
          </div>
        </div>
      </div>

      {/* Post body: preserves line breaks, highlights hashtags/mentions/links */}
      <div className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-anb-navy-dark">
        {renderContent(draft)}
      </div>

      {/* Optional link preview card (scraped server-side, passed in) */}
      {preview && <LinkPreviewCard preview={preview} />}

      {/* Static, non-interactive action bar — visual chrome only */}
      <div
        aria-hidden
        className="mt-3 flex items-center justify-between border-t border-anb-line pt-3 text-slate-400"
      >
        <ActionBarIcon path="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
        <ActionBarIcon path="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
        <ActionBarIcon path="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        <ActionBarIcon path="M3 3v18h18M7 14l4-4 3 3 5-6" />
      </div>
    </div>
  );
}
