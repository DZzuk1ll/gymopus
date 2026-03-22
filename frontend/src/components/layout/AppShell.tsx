"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopChatPanel } from "./DesktopChatPanel";
import { MobileTabBar } from "./MobileTabBar";
import { MobileHeader } from "./MobileHeader";

const EXCLUDED_PATHS = ["/onboarding", "/privacy"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't wrap onboarding or privacy pages
  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Desktop: three-column grid */}
      <div className="hidden lg:grid lg:grid-cols-[240px_1fr_360px] h-screen">
        <DesktopSidebar />
        <main className="overflow-y-auto">{children}</main>
        <DesktopChatPanel />
      </div>

      {/* Mobile: content + bottom tab bar */}
      <div className="lg:hidden flex flex-col h-screen">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <MobileTabBar />
      </div>
    </>
  );
}
