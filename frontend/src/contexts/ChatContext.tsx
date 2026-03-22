"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import type { ChatMessage } from "@/types";

interface ChatContextValue {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (message: string) => Promise<void>;
  draftInput: string;
  setDraftInput: (value: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const DRAFT_KEY = "gymopus_chat_draft";

export function ChatProvider({ children }: { children: ReactNode }) {
  const { messages, isStreaming, sendMessage, initializeMessages } =
    useStreamChat();
  const { data: history } = useChatHistory();

  const [draftInput, setDraftInputState] = useState("");

  // Restore draft from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) setDraftInputState(saved);
  }, []);

  const setDraftInput = useCallback((value: string) => {
    setDraftInputState(value);
    sessionStorage.setItem(DRAFT_KEY, value);
  }, []);

  // Clear draft after sending
  const handleSend = useCallback(
    async (message: string) => {
      setDraftInput("");
      await sendMessage(message);
    },
    [sendMessage, setDraftInput]
  );

  // Initialize from history
  useEffect(() => {
    if (history && history.length > 0) {
      initializeMessages(history);
    }
  }, [history, initializeMessages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isStreaming,
        sendMessage: handleSend,
        draftInput,
        setDraftInput,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
