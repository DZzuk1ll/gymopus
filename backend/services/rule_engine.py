from __future__ import annotations

import json
import math
import operator as op
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.checkin import (
    CheckinRecord,
    MoodLog,
    NutritionLog,
    SleepLog,
    TrainingLog,
)
from models.plan import Plan
from schemas.common import AlertBrief


@dataclass
class RuleCondition:
    metric: str
    operator: str
    threshold: float


@dataclass
class RuleRef:
    source: str = ""
    section: str = ""
    summary: str = ""


@dataclass
class Rule:
    id: str
    name: str
    category: str
    severity: str
    description: str = ""
    condition: RuleCondition = field(default_factory=lambda: RuleCondition("", "", 0))
    recommendation: str = ""
    reference: RuleRef | None = None


OPS = {
    ">": op.gt,
    "<": op.lt,
    ">=": op.ge,
    "<=": op.le,
    "==": op.eq,
}


class RuleEngine:
    def __init__(self, rules_path: str | None = None):
        if rules_path is None:
            rules_path = str(Path(__file__).parent.parent / "rules" / "default_rules.yaml")
        self.rules = self._load_rules(rules_path)

    def _load_rules(self, path: str) -> list[Rule]:
        with open(path) as f:
            data = yaml.safe_load(f)
        rules = []
        for r in data.get("rules", []):
            cond = r.get("condition", {})
            ref_data = r.get("reference")
            ref = RuleRef(**ref_data) if ref_data else None
            rules.append(Rule(
                id=r["id"],
                name=r["name"],
                category=r["category"],
                severity=r["severity"],
                description=r.get("description", ""),
                condition=RuleCondition(
                    metric=cond.get("metric", ""),
                    operator=cond.get("operator", ">"),
                    threshold=cond.get("threshold", 0),
                ),
                recommendation=r.get("recommendation", ""),
                reference=ref,
            ))
        return rules

    async def evaluate(
        self,
        db: AsyncSession,
        user_id: str,
        current_date: str,
    ) -> list[AlertBrief]:
        metrics = await self._compute_metrics(db, user_id, current_date)
        alerts: list[AlertBrief] = []

        for rule in self.rules:
            metric_value = metrics.get(rule.condition.metric)
            if metric_value is not None and self._compare(
                metric_value, rule.condition.operator, rule.condition.threshold
            ):
                alerts.append(AlertBrief(
                    id=rule.id,
                    title=rule.name,
                    severity=rule.severity,
                    trigger_type="rule",
                ))

        if self._should_trigger_ai(alerts):
            alerts.append(AlertBrief(
                id="AI_CROSS_SIGNAL",
                title="多信号交叉分析",
                severity="warning",
                trigger_type="ai",
            ))

        return alerts

    def _compare(self, value: float, operator_str: str, threshold: float) -> bool:
        func = OPS.get(operator_str)
        if func is None:
            return False
        return func(value, threshold)

    def _should_trigger_ai(self, alerts: list[AlertBrief]) -> bool:
        categories = set()
        for a in alerts:
            if a.severity != "info":
                rule = next((r for r in self.rules if r.id == a.id), None)
                if rule:
                    categories.add(rule.category)
        return len(categories) >= 2

    async def _compute_metrics(
        self,
        db: AsyncSession,
        user_id: str,
        current_date: str,
    ) -> dict[str, float | None]:
        today = date.fromisoformat(current_date)
        start = today - timedelta(days=14)
        start_str = start.isoformat()

        # Fetch recent checkins
        result = await db.execute(
            select(CheckinRecord)
            .where(
                CheckinRecord.user_id == user_id,
                CheckinRecord.date >= start_str,
                CheckinRecord.date <= current_date,
            )
            .order_by(CheckinRecord.date)
        )
        checkins = result.scalars().all()
        checkin_map = {c.date: c for c in checkins}
        checkin_ids = [c.id for c in checkins]

        metrics: dict[str, float | None] = {}

        # --- Training metrics ---
        training_logs = []
        if checkin_ids:
            result = await db.execute(
                select(TrainingLog).where(TrainingLog.checkin_id.in_(checkin_ids))
            )
            training_logs = result.scalars().all()

        tlog_by_checkin = {tl.checkin_id: tl for tl in training_logs}

        # Weekly volume change
        this_week_start = today - timedelta(days=today.weekday())
        last_week_start = this_week_start - timedelta(days=7)

        this_week_vol = 0.0
        last_week_vol = 0.0
        for c in checkins:
            d = date.fromisoformat(c.date)
            tl = tlog_by_checkin.get(c.id)
            if tl and tl.total_volume_kg:
                if this_week_start <= d <= today:
                    this_week_vol += tl.total_volume_kg
                elif last_week_start <= d < this_week_start:
                    last_week_vol += tl.total_volume_kg

        if last_week_vol > 0:
            metrics["weekly_volume_change_pct"] = ((this_week_vol - last_week_vol) / last_week_vol) * 100
        else:
            metrics["weekly_volume_change_pct"] = None

        # RPE overshoot streak (simplified: compare overall_rpe to target)
        metrics["rpe_overshoot_streak"] = None  # requires plan exercise target RPE comparison
        metrics["muscle_group_interval_hours"] = None  # requires muscle group tracking

        # --- Sleep metrics ---
        sleep_logs = []
        if checkin_ids:
            result = await db.execute(
                select(SleepLog).where(SleepLog.checkin_id.in_(checkin_ids))
            )
            sleep_logs = result.scalars().all()

        slog_by_checkin = {sl.checkin_id: sl for sl in sleep_logs}

        # Sleep below 6h streak (from most recent backwards)
        sleep_streak = 0
        for d_offset in range(15):
            d = today - timedelta(days=d_offset)
            d_str = d.isoformat()
            c = checkin_map.get(d_str)
            if c and c.id in slog_by_checkin:
                sl = slog_by_checkin[c.id]
                if sl.duration_hours is not None and sl.duration_hours < 6:
                    sleep_streak += 1
                else:
                    break
            else:
                break
        metrics["sleep_below_6h_streak"] = sleep_streak

        # Sleep quality 7d trend
        recent_quality = []
        for d_offset in range(7):
            d = today - timedelta(days=d_offset)
            c = checkin_map.get(d.isoformat())
            if c and c.id in slog_by_checkin:
                sl = slog_by_checkin[c.id]
                if sl.quality_score is not None:
                    recent_quality.append(sl.quality_score)

        if len(recent_quality) >= 3:
            mid = len(recent_quality) // 2
            first_half_avg = sum(recent_quality[mid:]) / len(recent_quality[mid:])
            second_half_avg = sum(recent_quality[:mid]) / len(recent_quality[:mid])
            if first_half_avg > 0:
                metrics["sleep_quality_7d_trend"] = ((second_half_avg - first_half_avg) / first_half_avg) * 100
            else:
                metrics["sleep_quality_7d_trend"] = None
        else:
            metrics["sleep_quality_7d_trend"] = None

        # --- Nutrition metrics ---
        nutrition_logs = []
        if checkin_ids:
            result = await db.execute(
                select(NutritionLog).where(NutritionLog.checkin_id.in_(checkin_ids))
            )
            nutrition_logs = result.scalars().all()

        nlog_by_checkin = {nl.checkin_id: nl for nl in nutrition_logs}

        # Get protein target from active plan
        plan_result = await db.execute(
            select(Plan).where(Plan.user_id == user_id, Plan.status == "active").limit(1)
        )
        active_plan = plan_result.scalar_one_or_none()
        protein_target = active_plan.target_protein if active_plan else None
        calorie_target = active_plan.target_calories if active_plan else None
        diet_goal = active_plan.diet_goal if active_plan else None

        # Protein below 80% streak
        protein_streak = 0
        if protein_target and protein_target > 0:
            threshold_80 = protein_target * 0.8
            for d_offset in range(15):
                d = today - timedelta(days=d_offset)
                c = checkin_map.get(d.isoformat())
                if c and c.id in nlog_by_checkin:
                    nl = nlog_by_checkin[c.id]
                    if nl.total_protein is not None and nl.total_protein < threshold_80:
                        protein_streak += 1
                    else:
                        break
                else:
                    break
        metrics["protein_below_80pct_streak"] = protein_streak

        # Protein 7d CV
        recent_protein = []
        for d_offset in range(7):
            d = today - timedelta(days=d_offset)
            c = checkin_map.get(d.isoformat())
            if c and c.id in nlog_by_checkin:
                nl = nlog_by_checkin[c.id]
                if nl.total_protein is not None:
                    recent_protein.append(nl.total_protein)

        if len(recent_protein) >= 3:
            mean_p = sum(recent_protein) / len(recent_protein)
            if mean_p > 0:
                variance = sum((x - mean_p) ** 2 for x in recent_protein) / len(recent_protein)
                metrics["protein_7d_cv"] = math.sqrt(variance) / mean_p
            else:
                metrics["protein_7d_cv"] = None
        else:
            metrics["protein_7d_cv"] = None

        # Unplanned calorie deficit streak
        deficit_streak = 0
        if calorie_target and calorie_target > 0 and diet_goal != "deficit":
            for d_offset in range(15):
                d = today - timedelta(days=d_offset)
                c = checkin_map.get(d.isoformat())
                if c and c.id in nlog_by_checkin:
                    nl = nlog_by_checkin[c.id]
                    if nl.total_calories is not None and nl.total_calories < calorie_target:
                        deficit_streak += 1
                    else:
                        break
                else:
                    break
        metrics["unplanned_calorie_deficit_streak"] = deficit_streak

        # --- Mood metrics ---
        mood_logs = []
        if checkin_ids:
            from models.checkin import MoodLog
            result = await db.execute(
                select(MoodLog).where(MoodLog.checkin_id.in_(checkin_ids))
            )
            mood_logs = result.scalars().all()

        mood_by_checkin = {ml.checkin_id: ml for ml in mood_logs}

        mood_streak = 0
        for d_offset in range(15):
            d = today - timedelta(days=d_offset)
            c = checkin_map.get(d.isoformat())
            if c and c.id in mood_by_checkin:
                ml = mood_by_checkin[c.id]
                if ml.level <= 2:
                    mood_streak += 1
                else:
                    break
            else:
                break
        metrics["mood_below_2_streak"] = mood_streak

        # --- Absent streak ---
        absent_streak = 0
        for d_offset in range(1, 15):  # start from yesterday
            d = today - timedelta(days=d_offset)
            if d.isoformat() not in checkin_map:
                absent_streak += 1
            else:
                break
        metrics["absent_streak"] = absent_streak

        return metrics
