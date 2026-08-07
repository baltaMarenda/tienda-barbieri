from datetime import datetime, timedelta, timezone
from app.core.core import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Depends
from app.repositories import user_repository
from app.db.deps import get_db
from app.models.user import User
import jwt


def create_access_token(data:dict):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload.update({"exp":expire})
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

security = HTTPBearer()
def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        decode = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    sub = decode.get("sub")

    if sub is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    sub = int(sub)
    user = user_repository.get_by_id(db, sub)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

def get_current_admin(user:User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )
    return user
    