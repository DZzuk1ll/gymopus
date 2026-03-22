"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, UtensilsCrossed, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DailyStatusForm } from "@/components/status/DailyStatusForm";

export function QuickActions() {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);

  const actions = [
    {
      label: "记录训练",
      icon: Dumbbell,
      onClick: () => router.push("/training"),
    },
    {
      label: "记录饮食",
      icon: UtensilsCrossed,
      onClick: () => router.push("/nutrition"),
    },
    {
      label: "打卡状态",
      icon: Activity,
      onClick: () => setStatusOpen(true),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Card
            key={action.label}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={action.onClick}
          >
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <action.icon className="size-5 text-primary" />
              <span className="text-xs font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={statusOpen} onOpenChange={setStatusOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>今日状态</SheetTitle>
          </SheetHeader>
          <div className="px-1 pb-4">
            <DailyStatusForm onSuccess={() => setStatusOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
