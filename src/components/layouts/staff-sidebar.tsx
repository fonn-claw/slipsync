"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Ship, Wrench, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MarinaLogo } from "./marina-logo";
import { LogoutButton } from "./logout-button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Marina Map", href: "/staff/operations", icon: Map },
  { title: "Check In/Out", href: "/staff/check-in", icon: Ship },
  { title: "Maintenance", href: "/staff/maintenance", icon: Wrench },
  { title: "Schedule", href: "/staff/schedule", icon: Calendar },
];

interface StaffSidebarProps {
  userName: string;
  userEmail: string;
}

export function StaffSidebar({ userName, userEmail }: StaffSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <MarinaLogo />
      </SidebarHeader>
      <Separator className="bg-sidebar-border" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Dock Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Separator className="mb-3 bg-sidebar-border" />
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-medium text-sidebar-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {userName}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {userEmail}
            </span>
          </div>
        </div>
        <LogoutButton variant="sidebar" />
      </SidebarFooter>
    </Sidebar>
  );
}
