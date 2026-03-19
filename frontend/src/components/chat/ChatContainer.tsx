"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useChatHistory } from "@/hooks/useChatHistory";

export function ChatContainer() {
  const { messages, isStreaming, sendMessage, initializeMessages } =
    useStreamChat();
  const { data: history } = useChatHistory();

  useEffect(() => {
    if (history && history.length > 0) {
      initializeMessages(history);
    }
  }, [history, initializeMessages]);
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
          <div className="text-center text-muted-foreground mt-20">
            <p className="text-lg font-medium mb-2">GymOpus 训练助手</p>
            <p className="text-sm">
              告诉我你的训练目标，我来帮你制定计划
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content === "" && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
                思考中...
              </div>
            </div>
          )}
      </div>
      <div className="border-t px-4 py-3 pb-20">
        <ChatInput
          onSend={(msg) => sendMessage(msg)}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
}
