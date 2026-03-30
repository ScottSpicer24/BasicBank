from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, UTC
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from app.models.user_models import get_user_by_id
from app.models.accounts_models import get_account

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# In-memory token blacklist; entries are cleared on server restart.
# For multi-process / persistent blacklisting, move this to a Redis or MongoDB store.
_token_blacklist: set[str] = set()

# Hash a password
def hash_password(password: str):
    return pwd_context.hash(password)
# Verify a password
def verify_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)

# Generate a JWT token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# blacklist a JWT token
def blacklist_token(token: str):
    _token_blacklist.add(token)

# checks if a JWT token is blacklisted
def is_token_blacklisted(token: str):
    return token in _token_blacklist

# decode a JWT token
def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# verify a JWT token and returns the user
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    if not token:
        raise credentials_exception

    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    # decode the token
    try:
        payload = decode_token(token)
    except JWTError:
        raise credentials_exception

    # get the user id from the token    
    user_id: str | None = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    # get the user from the database
    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    # attach the string user_id so downstream dependencies can reference it
    user["user_id"] = user_id
    return user


def verify_account_ownership(account_id: str, current_user: dict = Depends(get_current_user)):
    try:
        account = get_account(account_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if account.get("user_id") != current_user.get("user_id"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
