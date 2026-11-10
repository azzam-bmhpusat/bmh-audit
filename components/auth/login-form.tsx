"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "@/app/actions/auth";
import { loginSchema } from "@/lib/schemas";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";

const emptySubscribe = () => () => { };

export function LoginForm() {
  const router = useRouter();
  const isReady = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isReady || isLoading) return;

    setErrorMsg(null);

    const trimmedEmail = email.trim();
    const validationResult = loginSchema.safeParse({
      email: trimmedEmail,
      password,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || "Format email atau password tidak valid";
      setErrorMsg(firstIssue);
      toast.warning("Validasi login gagal", { description: firstIssue });
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginAction({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (!res.ok) {
        setErrorMsg(res.error);
        toast.error("Login gagal", { description: res.error });
        return;
      }

      toast.success("Login berhasil", { description: "Selamat datang!" });

      // Pastikan target hanya path internal valid yang diawali '/'
      const safeTarget =
        res.redirectUrl && res.redirectUrl.startsWith("/")
          ? res.redirectUrl
          : "/dashboard";

      router.replace(safeTarget);
      router.refresh();
    } catch (err: unknown) {
      console.error("[LOGIN_CLIENT_ERROR]", err);
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan pada jaringan atau server";
      setErrorMsg(message);
      toast.error("Terjadi kesalahan", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          BMH Audit
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          Instrumen Audit Kepatuhan Integratif — Satuan Internal Audit (SIA) BMH
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email-login">Email Login</Label>
            <div className="relative">
              <Input
                id="email-login"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jawa-timur@audit.bmh.or.id"
                autoFocus
                disabled={!isReady || isLoading}
                autoComplete="email"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Masukkan email akun Anda (contoh: jawa-timur@audit.bmh.or.id)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password-login">Password</Label>
            <InputGroup>
              <InputGroupInput
                id="password-login"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={!isReady || isLoading}
                autoComplete="current-password"
                required
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  disabled={!isReady || isLoading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={!isReady || isLoading}
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </Button>

          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground">
              Lupa password? Hubungi Admin.
            </p>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/" />}
          nativeButton={false}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Kembali ke Beranda</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
