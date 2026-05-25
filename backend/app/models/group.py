from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

DEFAULT_STATUSES = ["triage", "todo", "in-progress", "blocked", "done"]


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id"))
    name: Mapped[str] = mapped_column(String(100))
    statuses: Mapped[list] = mapped_column(JSON, default=lambda: DEFAULT_STATUSES.copy())
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    board: Mapped["Board"] = relationship(back_populates="groups")
    items: Mapped[list["Item"]] = relationship(back_populates="group", cascade="all, delete-orphan")
