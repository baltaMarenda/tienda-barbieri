from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import user_repository
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import verify_password
from app.core.auth import create_access_token

def login(db:Session, login_data: LoginRequest):
    user = user_repository.get_by_email(db, login_data.email)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    if not verify_password(login_data.password,user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    data = {
        "sub":str(user.id)
    }
    jwt = create_access_token(data)

    response = TokenResponse(
        access_token = jwt,
        token_type = "bearer"
    )
    return response
