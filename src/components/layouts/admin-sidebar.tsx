"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Calendar,
  CalendarDays,
  Users,
  Wrench,
  ListOrdered,
} from "lucide-react";
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
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Marina Map", href: "/marina", icon: Map },
  { title: "Bookings", href: "/admin/bookings", icon: Calendar },
  { title: "Calendar", href: "/admin/bookings/calendar", icon: CalendarDays },
  { title: "Boaters", href: "/admin/boaters", icon: Users },
  { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { title: "Waitlist", href: "/admin/waitlist", icon: ListOrdered },
];

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
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
            Navigation
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
