"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DraftForm from "@/components/DraftForm";
import ChatForm from "@/components/ChatForm";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function AppShell({ displayName }: { displayName?: string }) {
  const { mode } = useWorkspace();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heading =
    mode === "form" ? "النموذج المنظم" : "محادثة مُهَدّة";
  const subheading =
    mode === "form"
      ? "املأ الحقول، وسيصوغ المساعد مسودة تغريدة مطابقة لأسلوب anb."
      : "اكتب موضوعك بحرية، وسيختار المساعد القالب المناسب تلقائيًا.";

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
            className="absolute inset-0 bg-anb-navy-dark/50 backdrop-blur-sm"
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
            className="rounded-lg border border-anb-line px-3 py-1.5 text-sm text-anb-navy"
          >
            ☰
          </button>
          <span className="text-sm font-bold text-anb-navy">لوحة صياغة المحتوى</span>
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
          <div className="mb-8">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-anb-gold">
              مساحة العمل
            </span>
            <h2 className="text-2xl font-bold text-anb-navy">{heading}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{subheading}</p>
          </div>

          {mode === "form" ? <DraftForm /> : <ChatForm />}
        </main>

        <footer className="border-t border-anb-line py-5 text-center text-xs text-slate-400">
          أداة داخلية — لا يوجد نشر تلقائي على أي منصة
        </footer>
      </div>
    </div>
  );
}
