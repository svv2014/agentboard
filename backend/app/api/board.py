from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.board import Board
from app.models.group import Group
from app.models.item import Item
from app.api.deps import get_current_user

router = APIRouter(prefix="/board", tags=["board"])


@router.get("/")
def get_board(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.user_id == user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="No board found")
    groups = []
    for g in board.groups:
        items = db.query(Item).filter(Item.group_id == g.id, Item.deleted_at.is_(None)).all()
        groups.append({
            "id": g.id,
            "name": g.name,
            "statuses": g.statuses,
            "position": g.position,
            "items": [_item_dict(i) for i in items],
        })
    return {"id": board.id, "name": board.name, "groups": groups}


def _item_dict(item: Item) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "status": item.status,
        "metadata": item.metadata_,
        "created_by": item.created_by,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
