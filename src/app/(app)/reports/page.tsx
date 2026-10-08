import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { ReportsView } from "@/components/ReportsView";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return <ReportsView workspace={workspace} />;
}
