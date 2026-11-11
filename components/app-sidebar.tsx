"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { getNavGroupsForRole } from "@/lib/auth/role-guard";
import type { Role } from "@/types/audit";
import { ShieldCheckIcon } from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: Role;
}

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const navGroups = getNavGroupsForRole(role);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center border-b px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm">Satuan Internal Audit</span>
                <span className="text-[9px] text-muted-foreground">
                  {role === "admin" ? "Portal Auditor BMH" : "Portal Audite Perwakilan"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                // Menentukan status aktif menu
                const isExactMatch = pathname === item.url;
                const isSubMatch =
                  item.url !== "/dashboard" &&
                  item.url !== "/dashboard/admin" &&
                  item.url !== "/dashboard/user" &&
                  pathname.startsWith(item.url);
                const isActive = isExactMatch || isSubMatch;

                return (
                  <SidebarMenuItem key={item.url} className="my-0.5">
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={
                        <Link
                          href={item.url}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                        />
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer minimalis: tidak menduplikasi dropdown profil */}
      <SidebarFooter className="border-t p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">SIA BMH</span>
          <span className="text-[11px]">Audit Kepatuhan Integratif</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
