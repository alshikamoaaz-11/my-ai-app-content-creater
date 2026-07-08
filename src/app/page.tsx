import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import WorkspaceProvider from "@/components/WorkspaceProvider";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <WorkspaceProvider>
        <AppShell displayName={session?.displayName} />
      </WorkspaceProvider>
    </div>
  );
}
