"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/contexts/ChatContext";

const SUGGESTIONS = ["制定增肌计划", "分析我的饮食", "训练动作指导"];

export function DesktopChatPanel() {
  const { messages, isStreaming, sendMessage, draftInput, setDraftInput } =
    useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <aside className="border-l border-border/50 bg-background flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-medium tracking-tight flex items-center gap-2">
          <MessageSquare className="size-4" />
          AI 助手
        </h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="text-center mt-12">
            <MessageSquare className="size-8 mx-auto mb-3 text-primary/30" />
            <p className="text-sm font-medium mb-1">训练助手</p>
            <p className="text-xs text-muted-foreground mb-4">
              随时提问健身知识或生成计划
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
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

      <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm px-3 py-2.5">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          value={draftInput}
          onChange={setDraftInput}
        />
      </div>
    </aside>
  );
}
