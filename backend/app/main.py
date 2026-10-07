import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.router import api_router
from app.api.v1.health import HealthCheckResponse, get_health
import app.models  # noqa: F401 - ensure all models are registered

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown hooks."""
    logger.info(f"Starting {settings.PROJECT_NAME} [{settings.ENVIRONMENT}]...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/initialized.")
    except Exception as err:
        logger.warning(f"Database table verification deferred: {err}")

    # Initialize Qdrant collection if available
    try:
        from app.services.vector_store import VectorStoreService
        vs = VectorStoreService()
        vs.ensure_collection()
        logger.info("Vector store collection verified.")
    except Exception as vs_err:
        logger.warning(f"Vector store collection verification deferred: {vs_err}")

    # Pre-warm GPU / CPU Embedding Model into RAM / VRAM to eliminate runtime latency
    try:
        from app.services.embeddings import embedding_service
        logger.info("Pre-warming neural embedding model into GPU VRAM / system RAM...")
        embedding_service.embed_query("clario system warmup")
        logger.info("Neural embedding model pre-warmed and ready for maximum inference speed.")
    except Exception as warm_err:
        logger.warning(f"Embedding model pre-warming note: {warm_err}")

    yield


    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    try:
        engine.dispose()
        logger.info("Database connections disposed cleanly.")
    except Exception as shutdown_err:
        logger.error(f"Error during shutdown: {shutdown_err}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Knowledge Intelligence & RAG Platform API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" or True else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" or True else None,
    lifespan=lifespan,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to all incoming/outgoing HTTP responses."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# Middleware configuration
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global unhandled exception handler ensuring consistent error responses without leaking internals."""
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "path": str(request.url.path),
        },
    )


# Root level GET /health endpoint
@app.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check endpoint",
    tags=["Health"],
)
async def root_health(verbose: bool = False):
    return await get_health(verbose=verbose)


# Include API Routers under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }

