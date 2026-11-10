import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

export default async function LoginPage() {
  const session = await getCurrentProfile();

  if (session) {
    if (session.profile.role === "admin") {
      redirect("/nilai-audit");
    } else {
      redirect("/audit");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-muted/20">
      <LoginForm />
    </main>
  );
}
