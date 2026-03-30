from datetime import datetime, UTC
from fastapi import HTTPException
from app.schemas.user_schema import UserRegister, UserLogin
from app.models.user_models import post_user, get_user_by_email, push_activity_log
from app.utils.util import hash_password, verify_password, create_access_token, blacklist_token, decode_token


def register_user(user: UserRegister):
    if get_user_by_email(user.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user_data = user.model_dump()
    user_data["password"] = hash_password(user.password)
    user_data["created_at"] = datetime.now(UTC)
    user_data["activity_log"] = []
    post_user(user_data)
    return {"message": "User registered successfully"}


def login_user(credentials: UserLogin):
    user = get_user_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token({"user_id": user_id})
    push_activity_log(user_id, {"event": "login", "timestamp": datetime.now(UTC)})
    return {"access_token": token, "token_type": "bearer"}


def logout_user(token: str):
    payload = decode_token(token)
    user_id = payload.get("user_id")
    blacklist_token(token)
    if user_id:
        push_activity_log(user_id, {"event": "logout", "timestamp": datetime.now(UTC)})
    return {"message": "Logged out successfully"}
