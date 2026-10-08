import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { BudgetView } from "@/components/BudgetView";

export const metadata: Metadata = { title: "Monthly Budget" };

export default async function BudgetPage() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return <BudgetView workspace={workspace} />;
}
