import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return <DashboardView workspace={workspace} />;
}
