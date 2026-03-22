"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUpsertDailyStatus } from "@/hooks/useStatus";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const SLIDER_FIELDS = [
  { key: "sleep_quality", label: "睡眠质量", low: "差", high: "好" },
  { key: "fatigue_level", label: "疲劳程度", low: "精力充沛", high: "极度疲劳" },
  { key: "stress_level", label: "压力水平", low: "放松", high: "压力大" },
  { key: "mood", label: "情绪", low: "低落", high: "愉悦" },
] as const;

type SliderKey = (typeof SLIDER_FIELDS)[number]["key"];

export function DailyStatusForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const upsert = useUpsertDailyStatus();
  const [date, setDate] = useState(todayStr());
  const [weightKg, setWeightKg] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    sleep_quality: 3,
    fatigue_level: 3,
    stress_level: 3,
    mood: 3,
  });
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    try {
      await upsert.mutateAsync({
        date,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        sleep_quality: sliders.sleep_quality,
        fatigue_level: sliders.fatigue_level,
        stress_level: sliders.stress_level,
        mood: sliders.mood,
        notes: notes || null,
      });
      toast.success("状态已记录");
      onSuccess?.();
    } catch (e) {
      toast.error(`提交失败：${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">每日状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">日期</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">体重 (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="75.0"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">睡眠 (h)</Label>
            <Input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="7.5"
              className="font-mono"
            />
          </div>
        </div>

        {SLIDER_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{field.label}</Label>
              <span className="text-xs font-mono text-foreground">
                {sliders[field.key]}/5
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
                {field.low}
              </span>
              <Slider
                value={[sliders[field.key]]}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setSliders((prev) => ({ ...prev, [field.key]: v }));
                }}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                {field.high}
              </span>
            </div>
          </div>
        ))}

        <div className="space-y-1.5">
          <Label className="text-xs">备注（可选）</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="今天状态如何？"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={upsert.isPending}
        >
          {upsert.isPending ? "提交中..." : "提交"}
        </Button>
      </CardContent>
    </Card>
  );
}
