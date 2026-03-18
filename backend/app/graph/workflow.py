from langgraph.graph import StateGraph, START, END

from app.graph.state import GymOpusState
from app.graph.nodes.intent_router import intent_router
from app.graph.nodes.workout_planner import workout_planner
from app.graph.nodes.knowledge_qa import knowledge_qa
from app.graph.nodes.validator import validator
from app.graph.nodes.fallback import fallback
from app.graph.nodes.meal_planner import meal_planner
from app.graph.nodes.diet_analyzer import diet_analyzer


def route_by_intent(state: GymOpusState) -> str:
    intent = state.get("intent", "")
    if intent == "workout":
        return "workout_planner"
    elif intent == "meal":
        return "meal_planner"
    elif intent == "diet_analysis":
        return "diet_analyzer"
    elif intent == "qa":
        return "knowledge_qa"
    else:
        return "fallback"


def route_after_validation(state: GymOpusState) -> str:
    validation = state.get("validation_result", {})
    if validation.get("valid", False):
        return END
    retry_count = state.get("retry_count", 0)
    if retry_count < 3:
        return "workout_planner"
    return "fallback"


def build_graph() -> StateGraph:
    builder = StateGraph(GymOpusState)

    # Add nodes
    builder.add_node("intent_router", intent_router)
    builder.add_node("workout_planner", workout_planner)
    builder.add_node("meal_planner", meal_planner)
    builder.add_node("diet_analyzer", diet_analyzer)
    builder.add_node("knowledge_qa", knowledge_qa)
    builder.add_node("validator", validator)
    builder.add_node("fallback", fallback)

    # Add edges
    builder.add_edge(START, "intent_router")
    builder.add_conditional_edges(
        "intent_router",
        route_by_intent,
        {
            "workout_planner": "workout_planner",
            "meal_planner": "meal_planner",
            "diet_analyzer": "diet_analyzer",
            "knowledge_qa": "knowledge_qa",
            "fallback": "fallback",
        },
    )
    builder.add_edge("workout_planner", "validator")
    builder.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "workout_planner": "workout_planner",
            "fallback": "fallback",
            END: END,
        },
    )
    builder.add_edge("meal_planner", END)
    builder.add_edge("diet_analyzer", END)
    builder.add_edge("knowledge_qa", END)
    builder.add_edge("fallback", END)

    return builder


# Compile without checkpointer for now — checkpointer is added at runtime
# when we have the database connection available
graph_builder = build_graph()
graph = graph_builder.compile()
