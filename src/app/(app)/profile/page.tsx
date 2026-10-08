import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
import { ProfileView } from "@/components/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return <ProfileView workspace={workspace} />;
}
