from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.board import router as board_router
from app.mcp.server import router as mcp_router

app = FastAPI(title="AgentBoard", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(board_router)
app.include_router(mcp_router)


@app.get("/health")
def health():
    return {"status": "ok"}
