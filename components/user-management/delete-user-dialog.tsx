"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteUserAction } from "@/app/actions/user-management";
import type { UserListItem } from "@/types/audit";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  onSuccess?: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (!user) return null;

  const handleDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await deleteUserAction({ id: user.id });
      if (!res.ok) {
        toast.error("Gagal menghapus pengguna", { description: res.error });
        return;
      }

      toast.success(res.message || "Pengguna berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus akun");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Pengguna Permanen?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus akun{" "}
            <span className="font-semibold text-foreground">
              {user.nama || user.email}
            </span>{" "}
            ({user.email})? Tindakan ini akan menghapus akun login dan profil secara permanen dan tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Hapus Akun"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
