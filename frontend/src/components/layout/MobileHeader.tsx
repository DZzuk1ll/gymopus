"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileChatSheet } from "./MobileChatSheet";

const PAGE_TITLES: Record<string, string> = {
  "/": "仪表盘",
  "/training": "训练",
  "/nutrition": "饮食",
  "/settings": "设置",
  "/chat": "对话",
};

export function MobileHeader() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const title = PAGE_TITLES[pathname] ?? "GymOpus";

  // Don't show chat button on the chat tab itself
  const showChatButton = pathname !== "/chat";

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {showChatButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="size-5" />
          </Button>
        )}
      </header>

      <MobileChatSheet open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
