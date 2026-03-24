"use client";

import { logoutAction } from "@/app/(auth)/login/actions";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  variant?: "sidebar" | "navbar";
}

export function LogoutButton({ variant = "sidebar" }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size={variant === "sidebar" ? "sm" : "default"}
        className={
          variant === "sidebar"
            ? "w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            : "gap-2 text-muted-foreground hover:text-foreground"
        }
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </Button>
    </form>
  );
}
