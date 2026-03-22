"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/training", label: "训练", icon: Dumbbell },
  { href: "/nutrition", label: "饮食", icon: UtensilsCrossed },
  { href: "/settings", label: "设置", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-border/50 bg-background flex flex-col h-full">
      <div className="p-4 pb-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">GymOpus</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
