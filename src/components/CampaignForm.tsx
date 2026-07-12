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
  IconMegaphone,
  IconRefresh,
  IconSpinner,
  IconTrash,
} from "@/components/icons";

function VersionCard({
  label,
  draft,
  mandatoryHashtags,
  suggestedHashtags,
  isRegenerating,
  disabled,
  onRegenerate,
}: {
  label: string;
  draft: string;
  mandatoryHashtags: string[];
  suggestedHashtags: string[];
  isRegenerating: boolean;
  disabled: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="anb-card anb-fade-in p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-anb-line bg-slate-50 px-3 py-1 text-xs font-bold text-anb-navy">
          النسخة {label}
        </span>
        <div className="flex items-center gap-1.5">
          <ActionButton
            icon={copied ? <IconCheck /> : <IconCopy />}
            label={`نسخ النسخة ${label}`}
            onClick={handleCopy}
            disabled={!draft || isRegenerating}
          />
          <ActionButton
            icon={<IconRefresh />}
            label={`إعادة توليد النسخة ${label}`}
            onClick={onRegenerate}
            disabled={disabled || isRegenerating}
          />
        </div>
      </div>
      {isRegenerating ? (
        <div className="flex min-h-[220px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-anb-line bg-slate-50/60 p-6 text-center text-sm text-slate-400">
          <IconSpinner />
          جاري إعادة التوليد...
        </div>
      ) : (
        <>
          <XPostPreview draft={draft} preview={null} />
          <HashtagChips title="الهاشتاقات الإلزامية" hashtags={mandatoryHashtags} />
          <HashtagChips title="الهاشتاقات المقترحة" hashtags={suggestedHashtags} />
          <CompliancePanel draft={draft} workspace="campaign" />
        </>
      )}
    </div>
  );
}

export default function CampaignForm() {
  const {
    campaignBrief,
    setCampaignBrief,
    campaignDrafts,
    regeneratingCampaignLabels,
    status,
    error,
    generateCampaign,
    regenerateCampaignVariation,
    clearDraft,
  } = useWorkspace();
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generateCampaign();
  }

  async function handleCopyAll() {
    if (!hasDrafts) return;
    const text = campaignDrafts
      .map((d) => `النسخة ${d.label}:\n${d.draft}`)
      .join("\n\n———\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function handleRegenerateAll() {
    setCopiedAll(false);
    await generateCampaign();
  }

  function handleClearAll() {
    setCopiedAll(false);
    clearDraft();
  }

  const hasDrafts = campaignDrafts.length > 0;
  const isBusy = status === "loading" || regeneratingCampaignLabels.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="anb-card space-y-5 p-7 sm:p-8">
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy">
            موجز الحملة
          </label>
          <p className="mb-2 text-xs text-slate-400">
            صف حملتك بإيجاز، وسيولّد المساعد ٣ نسخ مختلفة (أ، ب، ج) دفعة واحدة.
          </p>
          <textarea
            value={campaignBrief}
            onChange={(e) => setCampaignBrief(e.target.value)}
            required
            rows={8}
            dir="rtl"
            placeholder="مثال: حملة استرداد نقدي على المطاعم لعملاء بطاقات anb الائتمانية خلال رمضان..."
            className="anb-field w-full resize-none rounded-lg px-3.5 py-2.5 text-sm leading-7 text-anb-ink"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !campaignBrief.trim()}
          className="anb-btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold text-anb-white disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center justify-center gap-2">
              <IconSpinner />
              جاري توليد ٣ نسخ...
            </span>
          ) : (
            "ولّد ٣ نسخ"
          )}
        </button>
      </form>

      <div className="space-y-6">
        <div className="anb-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-wide text-anb-navy">
              النسخ الثلاث
            </h2>
            <div className="flex items-center gap-2">
              {status === "success" && hasDrafts && (
                <span className="hidden items-center gap-1.5 rounded-full bg-anb-blue-pale px-3 py-1 text-xs font-semibold text-anb-blue sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-anb-blue" />
                  تم إنشاء النسخ
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <ActionButton
                  icon={copiedAll ? <IconCheck /> : <IconCopy />}
                  label="نسخ جميع النسخ"
                  onClick={handleCopyAll}
                  disabled={!hasDrafts || isBusy}
                />
                <ActionButton
                  icon={<IconRefresh />}
                  label="إعادة توليد الكل"
                  onClick={handleRegenerateAll}
                  disabled={isBusy || !campaignBrief.trim()}
                />
                <ActionButton
                  icon={<IconTrash />}
                  label="مسح جميع النسخ"
                  onClick={handleClearAll}
                  disabled={isBusy || !hasDrafts}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {!hasDrafts ? (
          <div className="anb-card flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <IconMegaphone className="h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-400">
              ستظهر النسخ الثلاث (أ، ب، ج) هنا بعد التوليد...
            </p>
          </div>
        ) : (
          campaignDrafts.map((d) => (
            <VersionCard
              key={d.label}
              label={d.label}
              draft={d.draft}
              mandatoryHashtags={d.mandatoryHashtags}
              suggestedHashtags={d.suggestedHashtags}
              isRegenerating={regeneratingCampaignLabels.includes(d.label)}
              disabled={status === "loading"}
              onRegenerate={() => regenerateCampaignVariation(d.label)}
            />
          ))
        )}
      </div>
    </div>
  );
}
