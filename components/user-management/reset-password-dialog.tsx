"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { resetUserPasswordAction } from "@/app/actions/user-management";
import { resetUserPasswordSchema } from "@/lib/schemas";
import { generateSecurePassword } from "@/lib/auth/password";
import { KeyRoundIcon, ShuffleIcon } from "lucide-react";
import type { UserListItem } from "@/types/audit";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <KeyRoundIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>Reset Password Pengguna</DialogTitle>
              <DialogDescription className="text-xs">
                Akun: <span className="font-semibold text-foreground">{user.nama || user.email}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <ResetPasswordFormContent
            key={user.id}
            user={user}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordFormContent({
  user,
  onOpenChange,
  onSuccess,
}: {
  user: UserListItem;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [passwordBaru, setPasswordBaru] = React.useState(() => generateSecurePassword(12));
  const [wajibGantiPassword, setWajibGantiPassword] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleQuickResetRandom = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const generated = generateSecurePassword(12);
    try {
      const res = await resetUserPasswordAction({
        id: user.id,
        passwordBaru: generated,
        wajib_ganti_password: true,
      });

      if (!res.ok) {
        toast.error("Gagal mereset password", { description: res.error });
        return;
      }

      toast.success("Password baru berhasil dibuat", {
        description: `Password sementara: ${generated}`,
        duration: 10000,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const parsed = resetUserPasswordSchema.safeParse({
      id: user.id,
      passwordBaru: passwordBaru.trim(),
      wajib_ganti_password: wajibGantiPassword,
    });

    if (!parsed.success) {
      toast.warning("Validasi gagal", {
        description: parsed.error.issues[0]?.message,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetUserPasswordAction(parsed.data);

      if (!res.ok) {
        toast.error("Gagal mereset password", { description: res.error });
        return;
      }

      toast.success(res.message || "Password berhasil direset");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* Opsi 1: Aksi Cepat 1-Klik Reset ke Password Acak Kuat */}
      <div className="rounded-lg border border-border p-3.5 space-y-2 bg-muted/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Opsi Cepat: Buat Password Acak Aman</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Menghasilkan password sementara 12 karakter acak yang aman dan mewajibkan pengguna mengganti password saat login berikutnya.
        </p>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="w-full gap-2 mt-1"
          onClick={handleQuickResetRandom}
          disabled={isLoading}
        >
          <ShuffleIcon className="size-3.5" />
          <span>{isLoading ? "Mereset..." : "Reset dengan Password Acak"}</span>
        </Button>
      </div>

      <div className="relative flex items-center justify-center">
        <span className="bg-background px-2 text-[11px] text-muted-foreground uppercase font-medium">
          Atau Tentukan Password Manual
        </span>
      </div>

      {/* Opsi 2: Password Kustom */}
      <form onSubmit={handleCustomSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="input-custom-pw">Password Baru</Label>
            <button
              type="button"
              onClick={() => setPasswordBaru(generateSecurePassword(12))}
              className="text-xs text-primary hover:underline"
            >
              Acak Ulang
            </button>
          </div>
          <Input
            id="input-custom-pw"
            type="text"
            placeholder="Minimal 8 karakter"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="reset-wajib-ganti"
            checked={wajibGantiPassword}
            onCheckedChange={(checked) => setWajibGantiPassword(Boolean(checked))}
            disabled={isLoading}
          />
          <Label
            htmlFor="reset-wajib-ganti"
            className="text-xs font-normal cursor-pointer select-none"
          >
            Wajibkan ganti password saat login berikutnya
          </Label>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
