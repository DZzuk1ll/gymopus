export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface User {
  id: string;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  training_goal: string | null;
  training_experience_years: number | null;
  training_frequency_per_week: number | null;
  session_duration_minutes: number | null;
  available_equipment: string[];
  dietary_restrictions: string[];
  dietary_preferences: string[];
  injuries: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// --- Chat ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  workout_plan?: WorkoutPlan | null;
  meal_plan?: MealPlan | null;
  diet_analysis?: DietAnalysis | null;
  intent?: string;
}

// --- Workout Plan ---

export interface ExerciseInPlan {
  exercise_id: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string;
}

export interface WorkoutDay {
  day_name: string;
  focus: string;
  exercises: ExerciseInPlan[];
}

export interface WorkoutPlan {
  plan_name: string;
  description: string;
  days_per_week: number;
  days: WorkoutDay[];
  methodology_notes: string;
  warnings: string[];
}

// --- Meal Plan ---

export interface MealFoodItem {
  food_id: string | null;
  name: string;
  portion_g: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MacroTotals {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface Meal {
  meal_name: string;
  foods: MealFoodItem[];
}

export interface MealPlan {
  plan_name: string;
  target: MacroTotals;
  total: MacroTotals;
  meals: Meal[];
  notes: string;
  warnings: string[];
}

// --- Meal Log ---

export interface MealLogCreate {
  logged_date: string;
  meal_type: string;
  raw_description: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  logged_date: string;
  meal_type: string;
  raw_description: string;
  parsed_foods: Record<string, unknown> | null;
  total_calories: number | null;
  total_protein: number | null;
  total_fat: number | null;
  total_carbs: number | null;
  analysis_notes: string | null;
}

// --- Diet Analysis ---

export interface DietAnalysis {
  parsed_foods: MealFoodItem[];
  totals: MacroTotals;
  targets: MacroTotals | null;
  diffs: MacroTotals | null;
  assessment: string;
  suggestions: string[];
  confidence: "high" | "medium" | "low";
}

// --- Daily Status ---

export interface DailyStatusCreate {
  date: string;
  weight_kg?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  fatigue_level?: number | null;
  stress_level?: number | null;
  mood?: number | null;
  notes?: string | null;
}

export interface DailyStatus {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  fatigue_level: number | null;
  stress_level: number | null;
  mood: number | null;
  notes: string | null;
}

// --- Status Report ---

export interface WeightTrend {
  date: string;
  value: number;
  moving_avg: number | null;
}

export interface StatusAverages {
  weight_kg: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  fatigue_level: number | null;
  stress_level: number | null;
  mood: number | null;
}

export interface StatusReport {
  period: string;
  start_date: string;
  end_date: string;
  weight_trend: WeightTrend[];
  averages: StatusAverages;
  weight_change: number | null;
  data_points: number;
}

// --- Weekly Report ---

export interface WeeklyReport {
  training_summary: string;
  diet_summary: string;
  status_summary: string;
  achievements: string[];
  concerns: string[];
  recommendations: string[];
}

// --- Workout Log ---

export interface WorkoutLogCreate {
  logged_date: string;
  exercise_id?: string | null;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_kg?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  logged_date: string;
  exercise_id: string | null;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_kg: number | null;
  rpe: number | null;
  notes: string | null;
}

export interface ExerciseHistory {
  history: WorkoutLog[];
  progression: Record<string, unknown>;
}

// --- Food ---

export interface Food {
  id: string;
  name_zh: string;
  name_en: string;
  category: string;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number | null;
  common_portion_desc: string | null;
  common_portion_g: number | null;
}

// --- SSE Events ---

export interface SSETokenEvent {
  type: "token";
  content: string;
}

export interface SSEFinalEvent {
  type: "final";
  response: string;
  intent: string;
  workout_plan: WorkoutPlan | null;
  meal_plan: MealPlan | null;
  diet_analysis: DietAnalysis | null;
}

export interface SSEErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent = SSETokenEvent | SSEFinalEvent | SSEErrorEvent;

// --- Training Plan ---

export interface TrainingPlan {
  id: string;
  plan_name: string;
  description: string;
  days_per_week: number;
  days: WorkoutDay[];
  methodology_notes: string | null;
  warnings: string[];
  constraints: string | null;
  source: "chat" | "training_page";
  status: "draft" | "active" | "archived";
  parent_plan_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Insights ---

export interface AnalysisResult {
  summary: string;
  insights: string[];
  concerns: string[];
  recommendations: string[];
}
