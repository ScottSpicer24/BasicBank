from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import UserRegister, UserLogin
from app.controllers.user_controller import register_user, login_user, logout_user
from app.utils.util import oauth2_scheme

router = APIRouter()


@router.post("/register")
def post_register(user: UserRegister):
    try:
        return register_user(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def post_login(credentials: UserLogin):
    try:
        return login_user(credentials)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
def post_logout(token: str = Depends(oauth2_scheme)):
    try:
        return logout_user(token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
