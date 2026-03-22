"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/contexts/ChatContext";

interface MobileChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileChatSheet({ open, onOpenChange }: MobileChatSheetProps) {
  const { messages, isStreaming, sendMessage, draftInput, setDraftInput } =
    useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [open, messages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="size-4" />
            AI 助手
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-2">
          {messages.length === 0 && (
            <div className="text-center mt-8">
              <MessageSquare className="size-8 mx-auto mb-3 text-primary/30" />
              <p className="text-sm text-muted-foreground">
                随时提问健身知识或生成计划
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1].content === "" && (
              <div className="flex justify-start mb-3">
                <div className="bg-card ring-1 ring-border/50 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-muted-foreground animate-pulse">
                  思考中...
                </div>
              </div>
            )}
        </div>

        <div className="border-t border-border/50 pt-2 pb-[env(safe-area-inset-bottom)]">
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
            value={draftInput}
            onChange={setDraftInput}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
