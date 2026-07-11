"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceProvider";

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-anb-white/15 text-anb-white shadow-inner ring-1 ring-anb-white/15"
          : "text-anb-white/70 hover:bg-anb-white/10 hover:text-anb-white"
      }`}
    >
      <span aria-hidden className="text-base">
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
    <div className="anb-navy-surface flex h-full w-full flex-col">
      <div className="anb-gold-rule h-[2px] w-full" />

      {/* Branding */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-anb-white text-sm font-extrabold tracking-wide text-anb-navy shadow-md">
          anb
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-anb-white">منصة صناعة المحتوى</p>
          <p className="text-[11px] text-anb-blue-light">فريق التسويق — X</p>
        </div>
      </div>

      {/* Search placeholder */}
      <div className="px-4 pb-3">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-anb-white/40"
          >
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في السجل..."
            className="w-full rounded-xl border border-anb-white/15 bg-anb-white/5 py-2 pr-9 pl-3 text-sm text-anb-white placeholder:text-anb-white/40 focus:border-anb-white/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1.5 px-4 pb-2">
        <NavButton
          active={mode === "form"}
          label="المولّد الذكي (قوالب جاهزة)"
          icon="🧾"
          onClick={() => go("form")}
        />
        <NavButton
          active={mode === "link"}
          label="تحويل الرابط إلى منشور"
          icon="🔗"
          onClick={() => go("link")}
        />
        <NavButton
          active={mode === "campaign"}
          label="توليد حملات مكثفة"
          icon="📣"
          onClick={() => go("campaign")}
        />
      </nav>

      {/* Recent history */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col px-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-anb-white/50">
            السجل الأخير
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] text-anb-white/50 transition hover:text-anb-white/80"
            >
              مسح الكل
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <p className="px-1 py-2 text-xs text-anb-white/40">
              {history.length === 0
                ? "السجل فارغ. المسودات الجديدة ستظهر هنا."
                : "لا نتائج مطابقة للبحث."}
            </p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-lg transition hover:bg-anb-white/10"
              >
                <button
                  type="button"
                  onClick={() => {
                    restore(item);
                    onNavigate?.();
                  }}
                  className="flex min-w-0 flex-1 flex-col items-start px-2.5 py-2 text-right"
                >
                  <span className="w-full truncate text-xs font-medium text-anb-white/90">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-anb-white/40">
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
                  className="ml-1 shrink-0 px-1.5 text-anb-white/30 opacity-0 transition group-hover:opacity-100 hover:text-anb-white/80"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer: user + logout */}
      <div className="border-t border-anb-white/10 px-4 py-4">
        {displayName && (
          <p className="mb-2 truncate px-1 text-xs text-anb-white/70">
            مرحبًا، {displayName}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-anb-white/20 px-3.5 py-2 text-xs font-semibold text-anb-white transition hover:border-anb-white/40 hover:bg-anb-white/10"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
