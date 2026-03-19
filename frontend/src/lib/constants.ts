export const TRAINING_GOALS = [
  { value: "muscle_gain", label: "增肌" },
  { value: "fat_loss", label: "减脂" },
  { value: "strength", label: "力量提升" },
  { value: "body_recomp", label: "体态改善" },
  { value: "maintenance", label: "维持现状" },
] as const;

export const EQUIPMENT = [
  "杠铃",
  "哑铃",
  "绳索/龙门架",
  "固定器械",
  "引体向上杆",
  "弹力带",
  "壶铃",
  "自重",
] as const;

export const LLM_PRESETS = [
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { name: "硅基流动", baseUrl: "https://api.siliconflow.cn/v1" },
  { name: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { name: "Ollama (本地)", baseUrl: "http://localhost:11434/v1" },
] as const;

export const LLM_STORAGE_KEY = "gymopus_llm_config";
