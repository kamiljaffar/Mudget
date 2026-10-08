import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { LogView } from "@/components/LogView";

export const metadata: Metadata = { title: "Daily Log" };

export default async function LogPage() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return <LogView workspace={workspace} />;
}
