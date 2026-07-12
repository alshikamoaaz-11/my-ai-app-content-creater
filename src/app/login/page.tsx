"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر تسجيل الدخول");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="anb-navy-surface relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 h-80 w-80 rounded-full bg-anb-blue-bright/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-anb-gold/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="anb-card relative overflow-hidden p-8">
          <div className="anb-gold-rule absolute inset-x-0 top-0 h-[3px]" />

          <div className="mb-7 text-center">
            <div className="anb-navy-surface mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-extrabold tracking-wide text-anb-white shadow-lg">
              anb
            </div>
            <h1 className="text-xl font-bold text-anb-navy">Haya Plus</h1>
            <p className="mt-1 text-sm font-semibold text-anb-navy/70">
              منصة صناعة المحتوى
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              سجّل الدخول للمتابعة إلى مساحة العمل
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="anb-field w-full rounded-xl px-3.5 py-2.5 text-sm text-anb-ink"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wide text-anb-navy">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="anb-field w-full rounded-xl px-3.5 py-2.5 text-sm text-anb-ink"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="anb-btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-anb-white disabled:opacity-60"
            >
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-anb-white/50">
          أداة داخلية لفريق التسويق — anb
        </p>
      </div>
    </main>
  );
}
