"use client";

import type { LinkPreview } from "@/lib/scrape";

/**
 * Presentational X/Open-Graph-style link preview card.
 * The preview data is scraped server-side (Crawl4AI or fetch fallback) and
 * passed in, so this component does no fetching of its own.
 */
export default function LinkPreviewCard({ preview }: { preview: LinkPreview | null }) {
  if (!preview) return null;

  let hostname = preview.siteName ?? "";
  try {
    hostname = new URL(preview.url).hostname;
  } catch {
    /* keep siteName */
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      className="mt-4 block overflow-hidden rounded-2xl border border-anb-line bg-anb-white transition hover:border-anb-blue hover:shadow-lg"
    >
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          className="h-44 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="space-y-1 p-3.5">
        <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">
          {hostname}
        </p>
        <p className="truncate text-sm font-semibold text-anb-navy-dark">
          {preview.title}
        </p>
        {preview.description && (
          <p className="line-clamp-2 text-xs leading-5 text-slate-500">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
