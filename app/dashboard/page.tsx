import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";

export const instant = false;

/**
 * Rute pembantu /dashboard yang mengarahkan pengguna sesuai role-nya.
 * Admin -> /nilai-audit
 * Cabang (user) -> /audit
 * Belum login -> /login
 */
export default async function DashboardPage() {
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  if (session.profile.role === "admin") {
    redirect("/nilai-audit");
  } else {
    redirect("/audit");
  }
}
