import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { AppShell } from "@/components/AppShell";
import { AppProviders } from "@/lib/providers";
import { LegacyBanner } from "@/components/LegacyBanner";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);

  return (
    <AppProviders>
      <AppShell
        profile={workspace.profile}
        ruleName={workspace.activeRule?.name ?? ""}
      >
        {children}
      </AppShell>
      <LegacyBanner workspace={workspace} />
    </AppProviders>
  );
}
