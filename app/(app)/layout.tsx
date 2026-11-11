import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { GantiPasswordDialog } from "@/components/ganti-password-dialog";

export const instant = false;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AuthenticatedAppLayout({
  children,
}: AppLayoutProps) {
  await connection();
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  // Baca state sidebar dari cookie di server layout untuk defaultOpen (mencegah hydration mismatch)
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const { profile, cabangNama } = session;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar role={profile.role} />
      <SidebarInset className="flex min-h-screen flex-1 min-w-0 flex-col bg-background">
        <AppHeader
          nama={profile.nama}
          role={profile.role}
          cabangNama={cabangNama}
        />
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </SidebarInset>

      {/* Dialog Wajib Ganti Password Terpusat */}
      {profile.wajib_ganti_password && <GantiPasswordDialog mode="wajib" />}
    </SidebarProvider>
  );
}
