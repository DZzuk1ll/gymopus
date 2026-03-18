from fastapi import APIRouter

router = APIRouter(prefix="/api")


def include_routers():
    """Import and include all sub-routers. Called after all modules are loaded."""
    from app.api.users import router as users_router
    from app.api.knowledge import router as knowledge_router
    from app.api.chat import router as chat_router
    from app.api.meals import router as meals_router
    from app.api.status import router as status_router
    from app.api.workouts import router as workouts_router

    router.include_router(users_router)
    router.include_router(knowledge_router)
    router.include_router(chat_router)
    router.include_router(meals_router)
    router.include_router(status_router)
    router.include_router(workouts_router)
