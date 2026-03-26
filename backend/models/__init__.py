from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from models.user import User, UserAIConfig  # noqa: E402, F401
from models.plan import Plan, PlanWeek, PlanDay, PlanExercise  # noqa: E402, F401
from models.checkin import (  # noqa: E402, F401
    CheckinRecord,
    TrainingLog,
    ExerciseLog,
    SetLog,
    NutritionLog,
    MealLog,
    SleepLog,
    SupplementLog,
    MoodLog,
    BodyMetricsLog,
)
from models.suggestion import Suggestion, SuggestionSignal, SuggestionReference  # noqa: E402, F401
from models.knowledge import KnowledgeEntry  # noqa: E402, F401
