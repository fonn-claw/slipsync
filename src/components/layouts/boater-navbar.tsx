"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Compass, Ship, Wrench, Menu, X } from "lucide-react";
import { useState } from "react";
import { MarinaLogo } from "./marina-logo";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { title: "My Bookings", href: "/boater/my-bookings", icon: Calendar },
  { title: "Browse Slips", href: "/boater/browse", icon: Compass },
  { title: "My Vessels", href: "/boater/vessels", icon: Ship },
  { title: "Maintenance", href: "/boater/maintenance", icon: Wrench },
];

interface BoaterNavbarProps {
  userName: string;
  userEmail: string;
}

export function BoaterNavbar({ userName, userEmail }: BoaterNavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/boater/my-bookings" className="flex items-center gap-2">
          <MarinaLogo size="sm" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Desktop user section */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">{userName}</span>
          </div>
          <LogoutButton variant="navbar" />
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <MarinaLogo size="sm" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-3 flex items-center gap-2 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </div>
              <LogoutButton variant="navbar" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
