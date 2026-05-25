from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.middleware import BodySizeLimitMiddleware
from app.api.board import router as board_router
from app.mcp.server import router as mcp_router

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="AgentBoard", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(board_router)
app.include_router(mcp_router)


@app.get("/health")
def health():
    return {"status": "ok"}
