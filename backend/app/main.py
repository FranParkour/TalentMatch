from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema para la clasificación y preselección de currículums (CVs) con IA.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS Middleware
cors_origins = settings.get_cors_origins()
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint confirming that the API service is active.
    """
    return {
        "message": "CV Screening API is running",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health_check": "/health",
        "api_v1_health": f"{settings.API_V1_STR}/health",
        "database_health_check": f"{settings.API_V1_STR}/health/database",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint verifying backend service status and database connectivity.
    No secrets or credentials are exposed.
    """
    from sqlalchemy import text
    from app.core.database import SessionLocal

    db_status = "connected"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception:
        db_status = "disconnected"

    is_healthy = db_status == "connected"
    return {
        "status": "ok" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
    }


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
