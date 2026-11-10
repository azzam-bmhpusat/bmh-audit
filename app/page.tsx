import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export const instant = false;

export default async function HomePage() {
  const session = await getCurrentProfile();

  if (session) {
    if (session.profile.role === "admin") {
      redirect("/nilai-audit");
    } else {
      redirect("/audit");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Internal Audit BMH
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Instrumen Audit Kepatuhan Integratif — Satuan Internal Audit (SIA) BMH
          </p>
        </div>

        <Button
          render={<Link href="/login" />}
          size="lg"
          className="w-full sm:w-auto min-w-36"
        >
          Masuk
        </Button>
      </div>
    </main>
  );
}
