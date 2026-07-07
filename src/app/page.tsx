import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import DraftForm from "@/components/DraftForm";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="anb-navy-surface relative">
        <div className="anb-gold-rule absolute inset-x-0 bottom-0 h-[2px]" />
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-anb-white text-sm font-extrabold tracking-wide text-anb-navy shadow-md">
              anb
            </div>
            <div>
              <h1 className="text-sm font-bold text-anb-white">
                لوحة صياغة المحتوى
              </h1>
              <p className="text-xs text-anb-blue-light">
                فريق التسويق — الحساب الرسمي على X
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="hidden text-sm text-anb-white/90 sm:inline">
                مرحبًا، {session.displayName}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <span className="mb-2 inline-block text-xs font-semibold tracking-widest text-anb-gold uppercase">
            مساحة العمل
          </span>
          <h2 className="text-2xl font-bold text-anb-navy">
            ماذا تودّ أن تنشئ اليوم؟
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            اختر الفئة وأدخل التفاصيل، وسيقوم المساعد بصياغة مسودة تغريدة
            جاهزة للمراجعة والنسخ.
          </p>
        </div>
        <DraftForm />
      </main>

      <footer className="border-t border-anb-line py-5 text-center text-xs text-slate-400">
        أداة داخلية — لا يوجد نشر تلقائي على أي منصة
      </footer>
    </div>
  );
}
