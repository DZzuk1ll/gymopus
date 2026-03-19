"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { DisclaimerDialog } from "@/components/legal/DisclaimerDialog";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && !user.onboarding_completed)) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatContainer />
      <DisclaimerDialog />
    </div>
  );
}
