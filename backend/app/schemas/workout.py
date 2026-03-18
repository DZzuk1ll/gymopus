from pydantic import BaseModel


class ExerciseInPlanResponse(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps_min: int
    reps_max: int
    rest_seconds: int
    notes: str


class WorkoutDayResponse(BaseModel):
    day_name: str
    focus: str
    exercises: list[ExerciseInPlanResponse]


class WorkoutPlanResponse(BaseModel):
    plan_name: str
    description: str
    days_per_week: int
    days: list[WorkoutDayResponse]
    methodology_notes: str
    warnings: list[str]
