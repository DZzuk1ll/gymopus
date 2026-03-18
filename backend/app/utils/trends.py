"""Pure Python trend analysis utilities for status data."""

from __future__ import annotations

import math
from datetime import date, timedelta


def moving_average(values: list[float], window: int = 7) -> list[float | None]:
    """Simple moving average. Returns None for positions with insufficient data."""
    result: list[float | None] = []
    for i in range(len(values)):
        if i < window - 1:
            result.append(None)
        else:
            window_vals = values[i - window + 1 : i + 1]
            result.append(round(sum(window_vals) / len(window_vals), 2))
    return result


def weighted_moving_average(values: list[float], window: int = 7) -> list[float | None]:
    """Weighted moving average — recent values count more."""
    result: list[float | None] = []
    weights = list(range(1, window + 1))
    total_weight = sum(weights)
    for i in range(len(values)):
        if i < window - 1:
            result.append(None)
        else:
            window_vals = values[i - window + 1 : i + 1]
            weighted_sum = sum(v * w for v, w in zip(window_vals, weights))
            result.append(round(weighted_sum / total_weight, 2))
    return result


def std_deviation(values: list[float]) -> float | None:
    """Standard deviation of a list of values."""
    if len(values) < 2:
        return None
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return round(math.sqrt(variance), 2)


def rate_of_change(values: list[float]) -> float | None:
    """Rate of change from first to last value."""
    if len(values) < 2:
        return None
    return round(values[-1] - values[0], 2)


def calc_weekly_summary(records: list[dict]) -> dict:
    """Calculate weekly aggregates from daily status records.

    Each record: {date, weight_kg, sleep_hours, sleep_quality,
                  fatigue_level, stress_level, mood}
    """
    return _calc_period_summary(records)


def calc_monthly_summary(records: list[dict]) -> dict:
    """Calculate monthly aggregates from daily status records."""
    return _calc_period_summary(records)


def _calc_period_summary(records: list[dict]) -> dict:
    """Generic period summary calculation."""
    if not records:
        return {
            "data_points": 0,
            "averages": {},
            "weight_change": None,
            "weight_trend": [],
        }

    fields = [
        "weight_kg", "sleep_hours", "sleep_quality",
        "fatigue_level", "stress_level", "mood",
    ]

    # Collect non-None values per field
    field_values: dict[str, list[float]] = {f: [] for f in fields}
    weight_series: list[dict] = []

    for r in records:
        for f in fields:
            val = r.get(f)
            if val is not None:
                field_values[f].append(float(val))
        if r.get("weight_kg") is not None:
            weight_series.append({
                "date": str(r["date"]) if isinstance(r["date"], date) else r["date"],
                "value": float(r["weight_kg"]),
            })

    # Averages
    averages = {}
    for f in fields:
        vals = field_values[f]
        if vals:
            averages[f] = round(sum(vals) / len(vals), 2)

    # Weight trend with moving average
    weight_vals = [w["value"] for w in weight_series]
    ma = moving_average(weight_vals, window=min(3, len(weight_vals) or 1))
    weight_trend = []
    for i, ws in enumerate(weight_series):
        ws["moving_avg"] = ma[i] if i < len(ma) else None
        weight_trend.append(ws)

    return {
        "data_points": len(records),
        "averages": averages,
        "weight_change": rate_of_change(weight_vals) if weight_vals else None,
        "weight_trend": weight_trend,
    }
