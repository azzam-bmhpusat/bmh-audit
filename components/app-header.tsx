"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GantiPasswordDialog } from "@/components/ganti-password-dialog";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/types/audit";
import { UserIcon, KeyRoundIcon, LogOutIcon, ChevronDownIcon } from "lucide-react";

interface AppHeaderProps {
  nama: string | null;
  role: Role;
  cabangNama?: string | null;
}

export function AppHeader({ nama, role, cabangNama }: AppHeaderProps) {
  const pathname = usePathname();
  const [isGantiPasswordOpen, setIsGantiPasswordOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const displayName = cabangNama || nama || (role === "admin" ? "Admin SIA" : "Pengguna Cabang");
  const roleLabel = role === "admin" ? "Auditor SIA" : "Audite Cabang";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground">
              BMH Audit
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Satuan Internal Audit (SIA)
            </span>
          </div>

          {/* Navigasi khusus Auditor SIA */}
          {role === "admin" && (
            <nav className="flex items-center gap-1.5" aria-label="Navigasi Utama">
              <Button
                variant={pathname.startsWith("/nilai-audit") ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-medium"
                render={<Link href="/nilai-audit" />}
              >
                Penilaian Cabang
              </Button>
              <Button
                variant={pathname.startsWith("/ringkasan") ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-medium"
                render={<Link href="/ringkasan" />}
              >
                Ringkasan Nasional
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isLoggingOut}
                />
              }
            >
              <UserIcon className="size-4 text-muted-foreground" />
              <span className="max-w-[140px] truncate sm:max-w-[200px] font-medium text-sm">
                {displayName}
              </span>
              <Badge variant={role === "admin" ? "default" : "secondary"}>
                {roleLabel}
              </Badge>
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Peran: {roleLabel}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setIsGantiPasswordOpen(true)}
                className="cursor-pointer gap-2"
              >
                <KeyRoundIcon className="size-4" />
                <span>Ganti Password</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer gap-2"
              >
                <LogOutIcon className="size-4" />
                <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialog Ganti Password Sukarela */}
      <GantiPasswordDialog
        mode="sukarela"
        open={isGantiPasswordOpen}
        onOpenChange={setIsGantiPasswordOpen}
      />
    </header>
  );
}

