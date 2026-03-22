"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Settings,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/training", label: "训练", icon: Dumbbell },
  { href: "/nutrition", label: "饮食", icon: UtensilsCrossed },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/chat", label: "对话", icon: MessageSquare },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-border/50 bg-background/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around">
        {TAB_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center py-2 px-3 text-xs transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
              <item.icon
                className={cn("size-5 mb-0.5", isActive && "stroke-[1.75]")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
