"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserStatsCards } from "./user-stats-cards";
import { UserDialog } from "./user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ImportUserDialog } from "./import-user-dialog";
import {
  UserPlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  KeyRoundIcon,
  Trash2Icon,
  ShieldCheckIcon,
  Building2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  UploadIcon,
} from "lucide-react";
import type { Cabang, UserListItem } from "@/types/audit";

interface UserManagementViewProps {
  initialUsers: UserListItem[];
  cabangList: Cabang[];
  currentAdminId: string;
}

export function UserManagementView({
  initialUsers,
  cabangList,
  currentAdminId,
}: UserManagementViewProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // State dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<UserListItem | null>(null);

  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = React.useState<UserListItem | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = React.useState<UserListItem | null>(null);

  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenCreateDialog = () => {
    setSelectedUserForEdit(null);
    setIsUserDialogOpen(true);
  };

  const handleOpenEditDialog = (user: UserListItem) => {
    setSelectedUserForEdit(user);
    setIsUserDialogOpen(true);
  };

  const handleOpenResetDialog = (user: UserListItem) => {
    setSelectedUserForReset(user);
    setIsResetDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: UserListItem) => {
    setSelectedUserForDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Statistik ringkasan
  const totalUsers = initialUsers.length;
  const totalAdmin = initialUsers.filter((u) => u.role === "admin").length;
  const totalCabang = initialUsers.filter((u) => u.role === "user").length;
  const totalWajibGantiPassword = initialUsers.filter((u) => u.wajib_ganti_password).length;

  // Filter daftar user
  const filteredUsers = React.useMemo(() => {
    return initialUsers.filter((u) => {
      // 1. Pencarian teks (nama, email, nama cabang)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.nama && u.nama.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.cabang?.nama && u.cabang.nama.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Filter Role
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      // 3. Filter Status Password
      if (statusFilter === "wajib" && !u.wajib_ganti_password) {
        return false;
      }
      if (statusFilter === "normal" && u.wajib_ganti_password) {
        return false;
      }

      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Tombol Aksi Utama */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola akun pengguna, email login, peran auditor/cabang, dan reset password.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RotateCcwIcon className="size-3.5" />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            className="gap-1.5"
          >
            <UploadIcon className="size-3.5" />
            <span>Import</span>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateDialog}
            className="gap-1.5"
          >
            <UserPlusIcon className="size-4" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* 2. Kartu Statistik */}
      <UserStatsCards
        totalUsers={totalUsers}
        totalAdmin={totalAdmin}
        totalCabang={totalCabang}
        totalWajibGantiPassword={totalWajibGantiPassword}
      />

      {/* 3. Filter & Pencarian */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Akun Pengguna
              </CardTitle>
              <CardDescription className="text-xs">
                Menampilkan {filteredUsers.length} dari {totalUsers} akun terdaftar
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Input Pencarian */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Cari nama, email, cabang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              {/* Filter Peran */}
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val ?? "all")}>
                <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs">
                  <SelectValue placeholder="Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peran</SelectItem>
                  <SelectItem value="admin">Auditor SIA</SelectItem>
                  <SelectItem value="user">Audite Cabang</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Status Password */}
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
                <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs">
                  <SelectValue placeholder="Status Password" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="wajib">Wajib Ganti Password</SelectItem>
                  <SelectItem value="normal">Normal / Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nama Pengguna</TableHead>
                <TableHead className="w-[240px]">Email Login</TableHead>
                <TableHead className="w-[120px]">Peran</TableHead>
                <TableHead className="w-[180px]">Cabang Tertaut</TableHead>
                <TableHead className="w-[150px]">Status Password</TableHead>
                <TableHead className="w-[110px]">Terdaftar</TableHead>
                <TableHead className="text-right w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentAdmin = user.id === currentAdminId;
                  return (
                    <TableRow key={user.id}>
                      {/* Nama */}
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{user.nama || "—"}</span>
                          {isCurrentAdmin && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              Anda
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {user.email || "—"}
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge variant="default" className="text-[11px] gap-1 font-medium">
                            <ShieldCheckIcon className="size-3" />
                            <span>Auditor SIA</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] gap-1 font-medium">
                            <Building2Icon className="size-3" />
                            <span>Cabang</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Cabang */}
                      <TableCell className="text-xs text-muted-foreground">
                        {user.role === "admin" ? (
                          <span className="italic">—</span>
                        ) : user.cabang?.nama ? (
                          <span className="text-foreground font-medium">
                            {user.cabang.nama}
                          </span>
                        ) : (
                          <span className="italic">Belum ditautkan</span>
                        )}
                      </TableCell>

                      {/* Status Password */}
                      <TableCell>
                        {user.wajib_ganti_password ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 py-0.5">
                            <AlertCircleIcon className="size-3 text-muted-foreground" />
                            <span>Wajib Ganti</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 py-0.5">
                            <CheckCircle2Icon className="size-3 text-muted-foreground" />
                            <span>Normal</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Tanggal */}
                      <TableCell className="text-[11px] text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Menu Aksi Pengguna"
                              />
                            }
                          >
                            <MoreHorizontalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(user)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <PencilIcon className="size-3.5" />
                              <span>Edit Profil</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenResetDialog(user)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <KeyRoundIcon className="size-3.5" />
                              <span>Reset Password</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={isCurrentAdmin}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Trash2Icon className="size-3.5" />
                              <span>{isCurrentAdmin ? "Akun Anda Sendiri" : "Hapus Akun"}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        userToEdit={selectedUserForEdit}
        cabangList={cabangList}
        onSuccess={handleRefresh}
      />

      <ResetPasswordDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        user={selectedUserForReset}
        onSuccess={handleRefresh}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUserForDelete}
        onSuccess={handleRefresh}
      />

      <ImportUserDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        cabangList={cabangList}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
