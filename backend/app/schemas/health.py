from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Estado de la API")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    service: str = Field(..., description="Nombre del servicio")
    version: str = Field(..., description="Versión de la API")
    environment: str = Field(..., description="Entorno de ejecución")


class DatabaseHealthResponse(BaseModel):
    status: str = Field(..., description="Estado del chequeo de base de datos")
    database: str = Field(..., description="Estado de conexión")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    database_name: Optional[str] = Field(None, description="Nombre de la base de datos conectada")
    error: Optional[str] = None
