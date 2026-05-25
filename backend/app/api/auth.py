import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.mcp_key import McpKey
from app.models.board import Board
from app.models.group import Group
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email, password_hash=hash_password(req.password))
    db.add(user)
    db.flush()
    board = Board(user_id=user.id, name="My Board")
    db.add(board)
    db.flush()
    group = Group(board_id=board.id, name="General", position=0)
    db.add(group)
    mcp_key = McpKey(user_id=user.id, key=secrets.token_hex(32), name="default")
    db.add(mcp_key)
    db.commit()
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/keys")
def list_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(McpKey).filter(McpKey.user_id == user.id, McpKey.revoked_at.is_(None)).all()
    return [{"id": k.id, "name": k.name, "key": k.key, "created_at": k.created_at} for k in keys]


@router.post("/keys")
def create_key(name: str = "default", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key = McpKey(user_id=user.id, key=secrets.token_hex(32), name=name)
    db.add(key)
    db.commit()
    return {"id": key.id, "name": key.name, "key": key.key}


@router.delete("/keys/{key_id}")
def revoke_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    key = db.query(McpKey).filter(McpKey.id == key_id, McpKey.user_id == user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    key.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"revoked": True}
