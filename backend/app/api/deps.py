"""Single-tenant local mode — no auth. Returns the default board directly."""
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.session import get_db
from app.models.board import Board
from app.models.group import Group


def get_default_board(db: Session = Depends(get_db)) -> Board:
    board = db.query(Board).first()
    if not board:
        board = Board(name="My Board")
        db.add(board)
        db.flush()
        group = Group(board_id=board.id, name="General", position=0)
        db.add(group)
        db.commit()
    return board
