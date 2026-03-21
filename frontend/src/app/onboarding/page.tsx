"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUser";
import { TRAINING_GOALS, EQUIPMENT } from "@/lib/constants";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    gender: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    body_fat_pct: "",
    training_goal: "",
    training_experience_years: "",
    training_frequency_per_week: "",
    session_duration_minutes: "",
    available_equipment: [] as string[],
    injuries: "",
    dietary_restrictions: "",
  });

  const update = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (item: string) => {
    setForm((prev) => ({
      ...prev,
      available_equipment: prev.available_equipment.includes(item)
        ? prev.available_equipment.filter((e) => e !== item)
        : [...prev.available_equipment, item],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.gender && form.age && form.height_cm && form.weight_kg;
      case 1:
        return form.training_goal && form.training_frequency_per_week;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const buildProfileData = () => ({
    gender: form.gender || null,
    age: form.age ? parseInt(form.age) : null,
    height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
    weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
    body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
    training_goal: form.training_goal || null,
    training_experience_years: form.training_experience_years
      ? parseFloat(form.training_experience_years)
      : null,
    training_frequency_per_week: form.training_frequency_per_week
      ? parseInt(form.training_frequency_per_week)
      : null,
    session_duration_minutes: form.session_duration_minutes
      ? parseInt(form.session_duration_minutes)
      : null,
    available_equipment: form.available_equipment,
    injuries: form.injuries
      ? form.injuries.split("，").map((s) => s.trim()).filter(Boolean)
      : [],
    dietary_restrictions: form.dietary_restrictions
      ? form.dietary_restrictions.split("，").map((s) => s.trim()).filter(Boolean)
      : [],
    onboarding_completed: true,
  });

  const handleSubmit = async () => {
    try {
      await updateProfile.mutateAsync(buildProfileData());
      router.replace("/");
    } catch {
      toast.error("保存失败，请重试");
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
      router.replace("/");
    } catch {
      toast.error("跳过失败，请重试");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">GymOpus</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            填写你的训练画像，获取更精准的推荐
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            跳过
          </Button>
        </div>
        <Progress
          value={((step + 1) / TOTAL_STEPS) * 100}
          className="mt-4 h-1"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right font-mono">
          {step + 1} / {TOTAL_STEPS}
        </p>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>性别</Label>
                <div className="flex gap-2">
                  {[
                    { value: "male", label: "男" },
                    { value: "female", label: "女" },
                  ].map((g) => (
                    <Button
                      key={g.value}
                      variant={form.gender === g.value ? "default" : "outline"}
                      onClick={() => update("gender", g.value)}
                      className="flex-1"
                      size="sm"
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>身高 (cm)</Label>
                  <Input
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => update("height_cm", e.target.value)}
                    placeholder="178"
                  />
                </div>
                <div className="space-y-2">
                  <Label>体重 (kg)</Label>
                  <Input
                    type="number"
                    value={form.weight_kg}
                    onChange={(e) => update("weight_kg", e.target.value)}
                    placeholder="75"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>体脂率 % (可选)</Label>
                <Input
                  type="number"
                  value={form.body_fat_pct}
                  onChange={(e) => update("body_fat_pct", e.target.value)}
                  placeholder="15"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">训练目标</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>目标</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_GOALS.map((goal) => (
                    <Button
                      key={goal.value}
                      variant={
                        form.training_goal === goal.value
                          ? "default"
                          : "outline"
                      }
                      onClick={() => update("training_goal", goal.value)}
                      size="sm"
                    >
                      {goal.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>训练经验 (年)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.training_experience_years}
                  onChange={(e) =>
                    update("training_experience_years", e.target.value)
                  }
                  placeholder="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>每周训练 (天)</Label>
                  <Input
                    type="number"
                    value={form.training_frequency_per_week}
                    onChange={(e) =>
                      update("training_frequency_per_week", e.target.value)
                    }
                    placeholder="4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>单次时长 (分钟)</Label>
                  <Input
                    type="number"
                    value={form.session_duration_minutes}
                    onChange={(e) =>
                      update("session_duration_minutes", e.target.value)
                    }
                    placeholder="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">器械与限制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>可用器械</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={`onboard-eq-${item}`}
                        checked={form.available_equipment.includes(item)}
                        onCheckedChange={() => toggleEquipment(item)}
                      />
                      <label
                        htmlFor={`onboard-eq-${item}`}
                        className="text-sm cursor-pointer"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>伤病/运动限制 (可留空)</Label>
                <Input
                  value={form.injuries}
                  onChange={(e) => update("injuries", e.target.value)}
                  placeholder="中文逗号分隔，例：左膝半月板损伤"
                />
              </div>
              <div className="space-y-2">
                <Label>饮食限制 (可留空)</Label>
                <Input
                  value={form.dietary_restrictions}
                  onChange={(e) =>
                    update("dietary_restrictions", e.target.value)
                  }
                  placeholder="中文逗号分隔，例：乳糖不耐，素食"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">确认你的画像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <span className="text-muted-foreground">性别</span>
                <span>{form.gender === "male" ? "男" : "女"}</span>
                <span className="text-muted-foreground">年龄</span>
                <span>{form.age} 岁</span>
                <span className="text-muted-foreground">身高</span>
                <span>{form.height_cm} cm</span>
                <span className="text-muted-foreground">体重</span>
                <span>{form.weight_kg} kg</span>
                {form.body_fat_pct && (
                  <>
                    <span className="text-muted-foreground">体脂率</span>
                    <span>{form.body_fat_pct}%</span>
                  </>
                )}
                <span className="text-muted-foreground">训练目标</span>
                <span>
                  {TRAINING_GOALS.find((g) => g.value === form.training_goal)
                    ?.label ?? form.training_goal}
                </span>
                {form.training_experience_years && (
                  <>
                    <span className="text-muted-foreground">训练经验</span>
                    <span>{form.training_experience_years} 年</span>
                  </>
                )}
                <span className="text-muted-foreground">每周训练</span>
                <span>{form.training_frequency_per_week} 天</span>
                {form.session_duration_minutes && (
                  <>
                    <span className="text-muted-foreground">单次时长</span>
                    <span>{form.session_duration_minutes} 分钟</span>
                  </>
                )}
              </div>
              {form.available_equipment.length > 0 && (
                <div>
                  <span className="text-muted-foreground">器械：</span>
                  {form.available_equipment.join("、")}
                </div>
              )}
              {form.injuries && (
                <div>
                  <span className="text-muted-foreground">伤病：</span>
                  {form.injuries}
                </div>
              )}
              {form.dietary_restrictions && (
                <div>
                  <span className="text-muted-foreground">饮食限制：</span>
                  {form.dietary_restrictions}
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                这些信息可以随时在设置页修改
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-3 mt-6 pb-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1"
          >
            <ChevronLeft className="size-4 mr-1" />
            上一步
          </Button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            下一步
            <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={updateProfile.isPending}
            className="flex-1"
          >
            <Check className="size-4 mr-1" />
            {updateProfile.isPending ? "保存中..." : "开始使用"}
          </Button>
        )}
      </div>
    </div>
  );
}
