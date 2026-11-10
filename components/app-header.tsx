"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GantiPasswordDialog } from "@/components/ganti-password-dialog";
import { logoutAction } from "@/app/actions/auth";
import { getRoleHome } from "@/lib/auth/role-guard";
import type { Role } from "@/types/audit";
import { UserIcon, KeyRoundIcon, LogOutIcon, ChevronDownIcon } from "lucide-react";

interface AppHeaderProps {
  nama: string | null;
  role: Role;
  cabangNama?: string | null;
}

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  user: "Cabang",
  audit: "Instrumen Audit",
  "nilai-audit": "Penilaian Cabang",
  ringkasan: "Ringkasan Nasional",
};

function getBreadcrumbs(pathname: string, role: Role): BreadcrumbEntry[] {
  const roleHome = getRoleHome(role);

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/dashboard/admin") {
    return [
      { label: "Dashboard", href: roleHome },
      { label: "Admin" },
    ];
  }

  if (pathname === "/dashboard/user") {
    return [
      { label: "Dashboard", href: roleHome },
      { label: "Cabang" },
    ];
  }

  if (pathname.startsWith("/audit")) {
    return [
      { label: "Dashboard", href: roleHome },
      { label: "Instrumen Audit" },
    ];
  }

  if (pathname.startsWith("/nilai-audit")) {
    return [
      { label: "Dashboard", href: roleHome },
      { label: "Penilaian Cabang" },
    ];
  }

  if (pathname.startsWith("/ringkasan")) {
    return [
      { label: "Dashboard", href: roleHome },
      { label: "Ringkasan Nasional" },
    ];
  }

  // Fallback untuk rute lainnya
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard" }];
  }

  const items: BreadcrumbEntry[] = [{ label: "Dashboard", href: roleHome }];
  let accPath = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accPath += `/${seg}`;
    if (seg === "dashboard") continue;

    const isLast = i === segments.length - 1;
    const label =
      ROUTE_LABELS[seg] ||
      seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");

    items.push({
      label,
      href: isLast ? undefined : accPath,
    });
  }

  return items;
}

export function AppHeader({ nama, role, cabangNama }: AppHeaderProps) {
  const pathname = usePathname();
  const [isGantiPasswordOpen, setIsGantiPasswordOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const breadcrumbs = React.useMemo(
    () => getBreadcrumbs(pathname, role),
    [pathname, role]
  );

  const displayName = cabangNama || nama || (role === "admin" ? "Admin SIA" : "Pengguna Cabang");
  const roleLabel = role === "admin" ? "Auditor SIA" : "Audite Cabang";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Sisi Kiri: SidebarTrigger + Breadcrumb */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  <BreadcrumbItem className={!isLast ? "hidden sm:inline-flex" : undefined}>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={item.href} />}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator className="hidden sm:inline-flex" />
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Sisi Kanan: HANYA Dropdown Profil */}
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
            <span className="max-w-[120px] truncate sm:max-w-[180px] font-medium text-xs sm:text-sm">
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
              variant="destructive"
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

      {/* Dialog Ganti Password Sukarela */}
      <GantiPasswordDialog
        mode="sukarela"
        open={isGantiPasswordOpen}
        onOpenChange={setIsGantiPasswordOpen}
      />
    </header>
  );
}
