"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Monitor } from "lucide-react";
import { useUser, useUpdateProfile, useDeleteUser } from "@/hooks/useUser";
import { TRAINING_GOALS, EQUIPMENT, LLM_PRESETS, LLM_STORAGE_KEY } from "@/lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const updateProfile = useUpdateProfile();
  const deleteUser = useDeleteUser();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [llmSaved, setLLMSaved] = useState(false);

  const [profile, setProfile] = useState({
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

  const [llmConfig, setLLMConfig] = useState({
    baseUrl: "",
    apiKey: "",
    model: "",
  });

  // Load user profile into form
  useEffect(() => {
    if (user) {
      setProfile({
        gender: user.gender ?? "",
        age: user.age?.toString() ?? "",
        height_cm: user.height_cm?.toString() ?? "",
        weight_kg: user.weight_kg?.toString() ?? "",
        body_fat_pct: user.body_fat_pct?.toString() ?? "",
        training_goal: user.training_goal ?? "",
        training_experience_years: user.training_experience_years?.toString() ?? "",
        training_frequency_per_week: user.training_frequency_per_week?.toString() ?? "",
        session_duration_minutes: user.session_duration_minutes?.toString() ?? "",
        available_equipment: user.available_equipment ?? [],
        injuries: user.injuries?.join("，") ?? "",
        dietary_restrictions: user.dietary_restrictions?.join("，") ?? "",
      });
    }
  }, [user]);

  // Load LLM config from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    if (raw) {
      try {
        setLLMConfig(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const updateField = (field: string, value: string | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (item: string) => {
    setProfile((prev) => ({
      ...prev,
      available_equipment: prev.available_equipment.includes(item)
        ? prev.available_equipment.filter((e) => e !== item)
        : [...prev.available_equipment, item],
    }));
  };

  const saveProfile = async () => {
    const data = {
      gender: profile.gender || null,
      age: profile.age ? parseInt(profile.age) : null,
      height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
      weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
      body_fat_pct: profile.body_fat_pct ? parseFloat(profile.body_fat_pct) : null,
      training_goal: profile.training_goal || null,
      training_experience_years: profile.training_experience_years
        ? parseFloat(profile.training_experience_years)
        : null,
      training_frequency_per_week: profile.training_frequency_per_week
        ? parseInt(profile.training_frequency_per_week)
        : null,
      session_duration_minutes: profile.session_duration_minutes
        ? parseInt(profile.session_duration_minutes)
        : null,
      available_equipment: profile.available_equipment,
      injuries: profile.injuries
        ? profile.injuries.split("，").map((s) => s.trim()).filter(Boolean)
        : [],
      dietary_restrictions: profile.dietary_restrictions
        ? profile.dietary_restrictions.split("，").map((s) => s.trim()).filter(Boolean)
        : [],
      onboarding_completed: true,
    };
    await updateProfile.mutateAsync(data);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const saveLLMConfig = () => {
    if (llmConfig.baseUrl && llmConfig.apiKey && llmConfig.model) {
      localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(llmConfig));
    } else {
      localStorage.removeItem(LLM_STORAGE_KEY);
    }
    setLLMSaved(true);
    setTimeout(() => setLLMSaved(false), 2000);
  };

  const handleDelete = async () => {
    await deleteUser.mutateAsync();
    localStorage.clear();
    router.push("/");
    window.location.reload();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">健身画像</CardTitle>
          <p className="text-sm text-muted-foreground">
            填写后可获得更精准的训练计划推荐
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>性别</Label>
            <div className="flex gap-2">
              {[
                { value: "male", label: "男" },
                { value: "female", label: "女" },
              ].map((g) => (
                <Button
                  key={g.value}
                  variant={profile.gender === g.value ? "default" : "outline"}
                  onClick={() => updateField("gender", g.value)}
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
              value={profile.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="25"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>身高 (cm)</Label>
              <Input
                type="number"
                value={profile.height_cm}
                onChange={(e) => updateField("height_cm", e.target.value)}
                placeholder="178"
              />
            </div>
            <div className="space-y-2">
              <Label>体重 (kg)</Label>
              <Input
                type="number"
                value={profile.weight_kg}
                onChange={(e) => updateField("weight_kg", e.target.value)}
                placeholder="75"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>体脂率 % (可选)</Label>
            <Input
              type="number"
              value={profile.body_fat_pct}
              onChange={(e) => updateField("body_fat_pct", e.target.value)}
              placeholder="15"
            />
          </div>

          <Separator />

          {/* Training Goals */}
          <div className="space-y-2">
            <Label>训练目标</Label>
            <div className="grid grid-cols-2 gap-2">
              {TRAINING_GOALS.map((goal) => (
                <Button
                  key={goal.value}
                  variant={profile.training_goal === goal.value ? "default" : "outline"}
                  onClick={() => updateField("training_goal", goal.value)}
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
              value={profile.training_experience_years}
              onChange={(e) => updateField("training_experience_years", e.target.value)}
              placeholder="2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>每周训练 (天)</Label>
              <Input
                type="number"
                value={profile.training_frequency_per_week}
                onChange={(e) => updateField("training_frequency_per_week", e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="space-y-2">
              <Label>单次时长 (分钟)</Label>
              <Input
                type="number"
                value={profile.session_duration_minutes}
                onChange={(e) => updateField("session_duration_minutes", e.target.value)}
                placeholder="60"
              />
            </div>
          </div>

          <Separator />

          {/* Equipment */}
          <div className="space-y-3">
            <Label>可用器械</Label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`eq-${item}`}
                    checked={profile.available_equipment.includes(item)}
                    onCheckedChange={() => toggleEquipment(item)}
                  />
                  <label htmlFor={`eq-${item}`} className="text-sm cursor-pointer">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Other Info */}
          <div className="space-y-2">
            <Label>伤病/运动限制 (中文逗号分隔，可留空)</Label>
            <Input
              value={profile.injuries}
              onChange={(e) => updateField("injuries", e.target.value)}
              placeholder="例：左膝半月板损伤，腰椎间盘突出"
            />
          </div>
          <div className="space-y-2">
            <Label>饮食限制 (中文逗号分隔，可留空)</Label>
            <Input
              value={profile.dietary_restrictions}
              onChange={(e) => updateField("dietary_restrictions", e.target.value)}
              placeholder="例：乳糖不耐，素食"
            />
          </div>

          <Button
            onClick={saveProfile}
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "保存中..." : profileSaved ? "已保存" : "保存画像"}
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">外观</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "light", icon: Sun, label: "浅色" },
              { value: "dark", icon: Moon, label: "深色" },
              { value: "system", icon: Monitor, label: "系统" },
            ].map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? "default" : "outline"}
                className="flex-1"
                size="sm"
                onClick={() => setTheme(t.value)}
              >
                <t.icon className="size-4 mr-1" />
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LLM Config Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">LLM 配置</CardTitle>
          <p className="text-sm text-muted-foreground">
            配置自己的 API Key 可解除每日使用限制
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {LLM_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() =>
                  setLLMConfig((prev) => ({
                    ...prev,
                    baseUrl: preset.baseUrl,
                  }))
                }
              >
                {preset.name}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input
              value={llmConfig.baseUrl}
              onChange={(e) =>
                setLLMConfig((prev) => ({ ...prev, baseUrl: e.target.value }))
              }
              placeholder="https://api.deepseek.com/v1"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={llmConfig.apiKey}
              onChange={(e) =>
                setLLMConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="sk-..."
            />
          </div>
          <div className="space-y-2">
            <Label>模型名称</Label>
            <Input
              value={llmConfig.model}
              onChange={(e) =>
                setLLMConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              placeholder="deepseek-chat"
            />
          </div>
          <Button onClick={saveLLMConfig} className="w-full">
            {llmSaved ? "已保存" : "保存配置"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">数据管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
          >
            删除我的所有数据
          </Button>
          <Link href="/privacy" className="block text-sm text-muted-foreground underline text-center">
            隐私政策
          </Link>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            这将永久删除你的所有数据，包括画像、训练记录、饮食记录和对话历史。此操作不可撤销。
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
