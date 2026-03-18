from pydantic import BaseModel


class WeightTrend(BaseModel):
    date: str
    value: float
    moving_avg: float | None = None


class StatusAverages(BaseModel):
    weight_kg: float | None = None
    sleep_hours: float | None = None
    sleep_quality: float | None = None
    fatigue_level: float | None = None
    stress_level: float | None = None
    mood: float | None = None


class StatusReportResponse(BaseModel):
    period: str  # weekly / monthly
    start_date: str
    end_date: str
    weight_trend: list[WeightTrend]
    averages: StatusAverages
    weight_change: float | None = None
    data_points: int
