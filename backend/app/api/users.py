from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)) -> ApiResponse[UserResponse]:
    return ApiResponse.ok(UserResponse.model_validate(user))


@router.put("/me/profile")
async def update_profile(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[UserResponse]:
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return ApiResponse.ok(UserResponse.model_validate(user))


@router.delete("/me")
async def delete_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[None]:
    await db.delete(user)
    await db.commit()
    return ApiResponse.ok()
