"use client";

import { useState } from "react";
import ActionButton from "@/components/ActionButton";
import { IconCheck, IconCopy } from "@/components/icons";

/**
 * Chip list for a group of hashtags (mandatory or AI-suggested), with copy
 * actions matching the rest of the workspace's icon-button pattern. Renders
 * nothing when there are no hashtags — the caller doesn't need to guard for
 * the "suggested" section being hidden when empty.
 */
export default function HashtagChips({
  title,
  hashtags,
  onHashtagClick,
}: {
  title: string;
  hashtags: string[];
  /** Reserved for future click-to-insert-into-post behaviour. */
  onHashtagClick?: (tag: string) => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (hashtags.length === 0) return null;

  async function handleCopyAll() {
    await navigator.clipboard.writeText(hashtags.join(" "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function handleCopyOne(tag: string) {
    await navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  }

  return (
    <div className="mt-6 border-t border-anb-line pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-anb-navy">
          {title}
        </span>
        <ActionButton
          icon={copiedAll ? <IconCheck /> : <IconCopy />}
          label={`نسخ الكل — ${title}`}
          onClick={handleCopyAll}
        />
      </div>
      <div dir="rtl" className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              onHashtagClick?.(tag);
              handleCopyOne(tag);
            }}
            title="نسخ الهاشتاق"
            className="inline-flex items-center gap-1 rounded-full bg-anb-blue-pale px-3 py-1 text-xs font-semibold text-anb-blue transition-colors hover:bg-anb-blue/10"
          >
            {copiedTag === tag ? <IconCheck className="h-3.5 w-3.5" /> : tag}
          </button>
        ))}
      </div>
    </div>
  );
}
