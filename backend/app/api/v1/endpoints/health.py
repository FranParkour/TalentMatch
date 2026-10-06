from datetime import datetime
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthCheckResponse, DatabaseHealthResponse
from app.schemas.openrouter import OpenRouterHealthResponse
from app.services.openrouter_service import openrouter_service

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="API Health Check",
    description="Returns the current operational status of the FastAPI backend service."
)
def check_api_health() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        timestamp=datetime.utcnow(),
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT
    )


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Database Connectivity Health Check",
    description="Tests live connectivity against the PostgreSQL instance using SQLAlchemy."
)
def check_database_health(db: Session = Depends(get_db)):
    try:
        # Perform a lightweight query to confirm connection
        db.execute(text("SELECT 1"))
        return DatabaseHealthResponse(
            status="ok",
            database="connected",
            timestamp=datetime.utcnow(),
            database_name=settings.POSTGRES_DB
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "database": "disconnected",
                "timestamp": datetime.utcnow().isoformat(),
                "database_name": settings.POSTGRES_DB,
                "error": str(exc)
            }
        )


@router.get(
    "/health/openrouter",
    response_model=OpenRouterHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="OpenRouter Connectivity Health Check",
    description="Tests live connectivity and authentication with OpenRouter using openrouter/free."
)
async def check_openrouter_health():
    result = await openrouter_service.test_connection()
    if result.get("status") == "ok":
        return OpenRouterHealthResponse(**result)
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result
        )
