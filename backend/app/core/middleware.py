from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

MAX_BODY_SIZE = 64 * 1024  # 64KB


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, max_size: int = MAX_BODY_SIZE):
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            return JSONResponse(
                {"detail": "Request body too large (max 64KB)"},
                status_code=413,
            )

        # Only check streaming size for POST/PUT/PATCH
        if request.method in ("POST", "PUT", "PATCH"):
            body = b""
            async for chunk in request.stream():
                body += chunk
                if len(body) > self.max_size:
                    return JSONResponse(
                        {"detail": "Request body too large (max 64KB)"},
                        status_code=413,
                    )
            # Re-inject body so downstream can read it
            request._body = body

        return await call_next(request)
