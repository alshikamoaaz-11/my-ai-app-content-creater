"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DraftForm from "@/components/DraftForm";
import LinkForm from "@/components/LinkForm";
import CampaignForm from "@/components/CampaignForm";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { IconMenu } from "@/components/icons";

const HEADINGS: Record<string, { heading: string; subheading: string }> = {
  form: {
    heading: "المولّد الذكي (قوالب جاهزة)",
    subheading: "املأ الحقول، وسيصوغ المساعد مسودة تغريدة مطابقة لأسلوب anb.",
  },
  link: {
    heading: "تحويل الرابط إلى منشور",
    subheading: "الصق رابطًا، ونحوّل عنوان الصفحة وصورتها إلى منشور بأسلوب anb.",
  },
  campaign: {
    heading: "توليد حملات مكثفة",
    subheading: "اكتب موجز الحملة، واحصل على ٣ نسخ مختلفة دفعة واحدة.",
  },
};

export default function AppShell({ displayName }: { displayName?: string }) {
  const { mode } = useWorkspace();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { heading, subheading } = HEADINGS[mode] ?? HEADINGS.form;

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop sidebar (RTL: sits on the right as the first flex child) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">
        <Sidebar displayName={displayName} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-anb-ink/25 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85%] shadow-2xl">
            <Sidebar
              displayName={displayName}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-anb-line bg-anb-white/70 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح القائمة"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-anb-line text-anb-navy transition-colors hover:bg-slate-50"
          >
            <IconMenu />
          </button>
          <span className="text-sm font-bold text-anb-navy">Haya Plus</span>
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10 lg:py-16">
          <div className="mb-12">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-slate-400">
              مساحة العمل
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-anb-navy">
              {heading}
            </h2>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">{subheading}</p>
          </div>

          {mode === "form" && <DraftForm />}
          {mode === "link" && <LinkForm />}
          {mode === "campaign" && <CampaignForm />}
        </main>

        <footer className="border-t border-anb-line py-8 text-center text-xs text-slate-400">
          أداة داخلية — لا يوجد نشر تلقائي على أي منصة
        </footer>
      </div>
    </div>
  );
}
