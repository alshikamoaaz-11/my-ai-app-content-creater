"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  IconDoc,
  IconLink,
  IconMegaphone,
  IconSearch,
  IconX,
} from "@/components/icons";

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
        active
          ? "bg-anb-blue-pale font-semibold text-anb-navy"
          : "font-medium text-slate-600 hover:bg-slate-100 hover:text-anb-navy"
      }`}
    >
      <span aria-hidden className={active ? "text-anb-blue" : "text-slate-400"}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function Sidebar({
  displayName,
  onNavigate,
}: {
  displayName?: string;
  onNavigate?: () => void;
}) {
  const { mode, setMode, history, restore, removeHistory, clearHistory } =
    useWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return history;
    return history.filter((h) => h.title.includes(q) || h.draft.includes(q));
  }, [history, query]);

  function go(next: "form" | "link" | "campaign") {
    setMode(next);
    onNavigate?.();
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full w-full flex-col border-l border-anb-line bg-anb-white">
      {/* Branding */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-anb-navy text-sm font-extrabold tracking-wide text-anb-white">
          anb
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-anb-navy">Haya Plus</p>
          <p className="text-[11px] text-slate-400">منصة صناعة المحتوى</p>
        </div>
      </div>

      {/* Search placeholder */}
      <div className="px-5 pb-4">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300"
          >
            <IconSearch />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في السجل..."
            className="w-full rounded-lg border border-anb-line bg-anb-white py-2 pr-9 pl-3 text-sm text-anb-ink placeholder:text-slate-400 transition-colors focus:border-anb-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-2 px-5 pb-3">
        <NavButton
          active={mode === "form"}
          label="المولّد الذكي (قوالب جاهزة)"
          icon={<IconDoc />}
          onClick={() => go("form")}
        />
        <NavButton
          active={mode === "link"}
          label="تحويل الرابط إلى منشور"
          icon={<IconLink />}
          onClick={() => go("link")}
        />
        <NavButton
          active={mode === "campaign"}
          label="توليد حملات مكثفة"
          icon={<IconMegaphone />}
          onClick={() => go("campaign")}
        />
      </nav>

      {/* Recent history */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            السجل الأخير
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] text-slate-400 transition-colors hover:text-slate-600"
            >
              مسح الكل
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-6">
          {filtered.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-400">
              {history.length === 0
                ? "السجل فارغ. المسودات الجديدة ستظهر هنا."
                : "لا نتائج مطابقة للبحث."}
            </p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    restore(item);
                    onNavigate?.();
                  }}
                  className="flex min-w-0 flex-1 flex-col items-start px-2.5 py-2 text-right"
                >
                  <span className="w-full truncate text-xs font-medium text-anb-ink">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.mode === "form"
                      ? "نموذج"
                      : item.mode === "link"
                        ? "رابط"
                        : "حملة"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeHistory(item.id)}
                  aria-label="حذف من السجل"
                  className="ml-1 shrink-0 px-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-slate-600"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer: user + logout */}
      <div className="border-t border-anb-line px-5 py-5">
        {displayName && (
          <p className="mb-3 truncate px-1 text-xs text-slate-500">
            مرحبًا، {displayName}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-anb-line px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-anb-navy"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
