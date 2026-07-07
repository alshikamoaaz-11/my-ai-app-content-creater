"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-anb-white/25 px-3.5 py-1.5 text-xs font-semibold text-anb-white transition hover:border-anb-white/40 hover:bg-anb-white/10"
    >
      تسجيل الخروج
    </button>
  );
}
