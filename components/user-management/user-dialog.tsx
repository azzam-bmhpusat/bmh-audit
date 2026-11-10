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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction, updateUserAction } from "@/app/actions/user-management";
import { createUserSchema, updateUserSchema } from "@/lib/schemas";
import { namaToEmail } from "@/lib/auth/nama-email";
import type { Cabang, Role, UserListItem } from "@/types/audit";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserListItem | null;
  cabangList: Cabang[];
  onSuccess?: () => void;
}

export function UserDialog({
  open,
  onOpenChange,
  userToEdit,
  cabangList,
  onSuccess,
}: UserDialogProps) {
  const isEditMode = Boolean(userToEdit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Profil Pengguna" : "Tambah Pengguna Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Perbarui informasi akun, email login, atau peran pengguna."
              : "Daftarkan akun pengguna baru untuk auditor SIA atau cabang BMH."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <UserFormContent
            key={userToEdit ? userToEdit.id : "new"}
            userToEdit={userToEdit}
            cabangList={cabangList}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserFormContent({
  userToEdit,
  cabangList,
  onOpenChange,
  onSuccess,
}: {
  userToEdit?: UserListItem | null;
  cabangList: Cabang[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const isEditMode = Boolean(userToEdit);

  const [nama, setNama] = React.useState(userToEdit?.nama || "");
  const [email, setEmail] = React.useState(
    userToEdit?.email || (userToEdit?.nama ? namaToEmail(userToEdit.nama) : "")
  );
  const [isEmailCustomized, setIsEmailCustomized] = React.useState(Boolean(userToEdit));
  const [role, setRole] = React.useState<Role>(userToEdit?.role || "user");
  const [cabangId, setCabangId] = React.useState<string>(
    userToEdit?.cabang_id ? String(userToEdit.cabang_id) : "none"
  );
  const [password, setPassword] = React.useState("www.bmh.or.id");
  const [wajibGantiPassword, setWajibGantiPassword] = React.useState(
    userToEdit ? userToEdit.wajib_ganti_password : true
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle otomatisasi saran email dari nama (hanya mode create)
  const handleNamaChange = (val: string) => {
    setNama(val);
    if (!isEditMode && !isEmailCustomized) {
      if (val.trim()) {
        setEmail(namaToEmail(val));
      } else {
        setEmail("");
      }
    }
  };

  const handleRoleChange = (newRole: "user" | "admin" | null) => {
    if (!newRole) return;
    setRole(newRole);
    if (newRole === "admin") {
      setCabangId("none");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedNama = nama.trim();
    const trimmedEmail = email.trim();

    if (isEditMode && userToEdit) {
      const payload = {
        id: userToEdit.id,
        nama: trimmedNama,
        email: trimmedEmail,
        role,
        cabang_id: role === "user" && cabangId !== "none" ? Number(cabangId) : null,
        wajib_ganti_password: wajibGantiPassword,
      };

      const parsed = updateUserSchema.safeParse(payload);
      if (!parsed.success) {
        toast.warning("Validasi gagal", {
          description: parsed.error.issues[0]?.message,
        });
        return;
      }

      setIsLoading(true);
      try {
        const res = await updateUserAction(parsed.data);
        if (!res.ok) {
          toast.error("Gagal memperbarui pengguna", { description: res.error });
          return;
        }
        toast.success(res.message || "Pengguna berhasil diperbarui");
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error("Terjadi kesalahan sistem");
      } finally {
        setIsLoading(false);
      }
    } else {
      const payload = {
        nama: trimmedNama,
        email: trimmedEmail,
        role,
        cabang_id: role === "user" && cabangId !== "none" ? Number(cabangId) : null,
        password: password.trim(),
        wajib_ganti_password: wajibGantiPassword,
      };

      const parsed = createUserSchema.safeParse(payload);
      if (!parsed.success) {
        toast.warning("Validasi gagal", {
          description: parsed.error.issues[0]?.message,
        });
        return;
      }

      setIsLoading(true);
      try {
        const res = await createUserAction(parsed.data);
        if (!res.ok) {
          toast.error("Gagal membuat pengguna", { description: res.error });
          return;
        }
        toast.success(res.message || "Pengguna baru berhasil dibuat");
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error("Terjadi kesalahan sistem");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 1. Nama Akun */}
          <div className="space-y-1.5">
            <Label htmlFor="input-nama">Nama Pengguna / Cabang</Label>
            <Input
              id="input-nama"
              placeholder="Contoh: Jawa Timur atau Auditor 1"
              value={nama}
              onChange={(e) => handleNamaChange(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* 2. Email Login */}
          <div className="space-y-1.5">
            <Label htmlFor="input-email">Email Login</Label>
            <Input
              id="input-email"
              type="email"
              placeholder="user@audit.bmh.or.id"
              value={email}
              onChange={(e) => {
                setIsEmailCustomized(true);
                setEmail(e.target.value);
              }}
              disabled={isLoading}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Email ini digunakan saat pengguna masuk ke sistem.
            </p>
          </div>

          {/* 3. Role */}
          <div className="space-y-1.5">
            <Label htmlFor="select-role">Peran (Role)</Label>
            <Select value={role} onValueChange={handleRoleChange} disabled={isLoading}>
              <SelectTrigger id="select-role" className="w-full">
                <SelectValue placeholder="Pilih peran..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Audite Cabang (User)</SelectItem>
                <SelectItem value="admin">Auditor SIA (Admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Tautan Cabang (Hanya jika role user) */}
          {role === "user" && (
            <div className="space-y-1.5">
              <Label htmlFor="select-cabang">Tautkan ke Cabang</Label>
              <Select
                value={cabangId}
                onValueChange={(val) => setCabangId(val ?? "none")}
                disabled={isLoading}
              >
                <SelectTrigger id="select-cabang" className="w-full">
                  <SelectValue placeholder="Pilih cabang..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Tanpa Cabang Tertaut --</SelectItem>
                  {cabangList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nama} {c.kode ? `(${c.kode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 5. Password Awal (Hanya mode Create) */}
          {!isEditMode && (
            <div className="space-y-1.5">
              <Label htmlFor="input-password">Password Awal</Label>
              <Input
                id="input-password"
                type="text"
                placeholder="Default: www.bmh.or.id"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Default bersama: <span className="font-mono font-medium">www.bmh.or.id</span>
              </p>
            </div>
          )}

          {/* 6. Checkbox Wajib Ganti Password */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="wajib-ganti-pw"
              checked={wajibGantiPassword}
              onCheckedChange={(checked) => setWajibGantiPassword(Boolean(checked))}
              disabled={isLoading}
            />
            <Label
              htmlFor="wajib-ganti-pw"
              className="text-xs font-normal cursor-pointer select-none"
            >
              Wajib ganti password saat login berikutnya
            </Label>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Menyimpan..."
                : isEditMode
                ? "Simpan Perubahan"
                : "Buat Pengguna"}
            </Button>
          </DialogFooter>
        </form>
  );
}
