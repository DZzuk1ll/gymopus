"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/contexts/ChatContext";

const SUGGESTIONS = ["制定增肌计划", "分析我的饮食", "训练动作指导"];

export default function ChatPage() {
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
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <MessageSquare className="size-10 mx-auto mb-4 text-primary/30" />
            <p className="text-lg font-semibold tracking-tight mb-2">
              GymOpus 训练助手
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              告诉我你的训练目标，我来帮你制定计划
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
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
            <div className="flex justify-start mb-4">
              <div className="bg-card ring-1 ring-border/50 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground animate-pulse">
                思考中...
              </div>
            </div>
          )}
      </div>
      <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm px-4 py-3">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          value={draftInput}
          onChange={setDraftInput}
        />
      </div>
    </div>
  );
}
