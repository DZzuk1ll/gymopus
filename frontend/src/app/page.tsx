"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisclaimerDialog } from "@/components/legal/DisclaimerDialog";
import { useUser } from "@/hooks/useUser";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { ProgressMetrics } from "@/components/dashboard/ProgressMetrics";

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
    <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight lg:hidden">仪表盘</h1>
      <TodayOverview />
      <QuickActions />
      <ProgressMetrics />
      <AIInsightsCard />
      <DisclaimerDialog />
    </div>
  );
}
