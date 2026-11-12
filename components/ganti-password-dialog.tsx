"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { gantiPasswordAction, logoutAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { KeyRoundIcon, LogOutIcon } from "lucide-react";

interface GantiPasswordDialogProps {
  mode: "wajib" | "sukarela";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GantiPasswordDialog({
  mode,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: GantiPasswordDialogProps) {
  const isWajib = mode === "wajib";
  const [internalOpen, setInternalOpen] = React.useState(isWajib);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    // Pada mode wajib, dialog tidak boleh ditutup oleh klik luar atau tombol ESC
    if (isWajib && !nextOpen) {
      return;
    }
    if (setControlledOpen) {
      setControlledOpen(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const [passwordLama, setPasswordLama] = React.useState("");
  const [passwordBaru, setPasswordBaru] = React.useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordLama) {
      setErrorMsg("Password saat ini wajib diisi");
      return;
    }

    if (passwordBaru.length < 8) {
      setErrorMsg("Password minimal 8 karakter");
      return;
    }

    if (passwordBaru === "www.bmh.or.id") {
      setErrorMsg("Password tidak boleh sama dengan password default www.bmh.or.id");
      return;
    }

    if (passwordBaru === passwordLama) {
      setErrorMsg("Password baru tidak boleh sama dengan password saat ini");
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setErrorMsg("Konfirmasi password tidak cocok");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await gantiPasswordAction({
        passwordLama,
        passwordBaru,
        konfirmasiPassword,
      });

      if (!res.ok) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success("Password berhasil diperbarui");
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasiPassword("");

      if (isWajib) {
        // Refresh halaman agar state wajib_ganti_password di server diperbarui
        window.location.reload();
      } else {
        handleOpenChange(false);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat memperbarui password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isWajib} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-muted-foreground" />
            <DialogTitle>
              {isWajib ? "Wajib Ganti Password" : "Ganti Password"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isWajib
              ? "Akun Anda masih menggunakan password default. Untuk keamanan sistem, silakan buat password baru minimal 8 karakter."
              : "Masukkan password baru Anda (minimal 8 karakter dan tidak boleh menggunakan password default)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password-lama">Password Saat Ini</Label>
            <Input
              id="password-lama"
              type="password"
              value={passwordLama}
              onChange={(e) => setPasswordLama(e.target.value)}
              placeholder="Masukkan password saat ini"
              disabled={isSubmitting || isLoggingOut}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password-baru">Password Baru</Label>
            <Input
              id="password-baru"
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Minimal 8 karakter"
              disabled={isSubmitting || isLoggingOut}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="konfirmasi-password">Konfirmasi Password Baru</Label>
            <Input
              id="konfirmasi-password"
              type="password"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              disabled={isSubmitting || isLoggingOut}
              autoComplete="new-password"
              required
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            {isWajib ? (
              <div className="flex w-full items-center justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isSubmitting || isLoggingOut}
                >
                  <LogOutIcon className="size-4" />
                  {isLoggingOut ? "Keluar..." : "Keluar"}
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting || isLoggingOut}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Password"}
                </Button>
              </div>
            ) : (
              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Password"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
