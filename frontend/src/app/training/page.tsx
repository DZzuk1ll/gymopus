"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { useActivePlan } from "@/hooks/useTrainingPlans";
import { ActivePlanDisplay } from "@/components/training/ActivePlanDisplay";
import { PlanGenerationFlow } from "@/components/training/PlanGenerationFlow";
import { PlanEditor } from "@/components/training/PlanEditor";
import { TrainingLogHistory } from "@/components/training/TrainingLogHistory";

export default function TrainingPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, userLoading, router]);

  const { data: activePlan, isLoading: planLoading } = useActivePlan();
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (planLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight lg:hidden">训练</h1>

      {editing && activePlan ? (
        <PlanEditor plan={activePlan} onDone={() => setEditing(false)} />
      ) : activePlan && !regenerating ? (
        <ActivePlanDisplay
          plan={activePlan}
          onEdit={() => setEditing(true)}
          onRegenerate={() => setRegenerating(true)}
        />
      ) : (
        <PlanGenerationFlow />
      )}

      {regenerating && (
        <PlanGenerationFlow />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">训练记录</h2>
        <TrainingLogHistory />
      </div>
    </div>
  );
}
