"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, UtensilsCrossed, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "对话", icon: MessageSquare },
  { href: "/nutrition", label: "饮食", icon: UtensilsCrossed },
  { href: "/dashboard", label: "状态", icon: Activity },
  { href: "/settings", label: "设置", icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around max-w-lg mx-auto">
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
                "flex flex-col items-center py-2 px-4 text-xs",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
