import { Anchor } from "lucide-react";

interface MarinaLogoProps {
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MarinaLogo({ collapsed = false, size = "md" }: MarinaLogoProps) {
  const iconSizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-2xl" };
  const subtitleSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-md bg-sidebar-primary/20 p-1.5">
        <Anchor className={`${iconSizes[size]} text-sidebar-primary`} />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-semibold leading-tight tracking-tight`}>
            SlipSync
          </span>
          <span className={`${subtitleSizes[size]} text-muted-foreground leading-tight`}>
            Marina Management
          </span>
        </div>
      )}
    </div>
  );
}
