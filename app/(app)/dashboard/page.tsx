import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";

export const instant = false;

export default async function DashboardRootPage() {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  if (session.profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/user");
}
