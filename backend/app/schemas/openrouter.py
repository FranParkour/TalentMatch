from typing import Optional
from pydantic import BaseModel, Field


class OpenRouterHealthResponse(BaseModel):
    status: str = Field(..., description="Estado del chequeo ('ok' o 'error')")
    provider: str = Field(default="openrouter", description="Proveedor de Inteligencia Artificial")
    model: str = Field(default="openrouter/free", description="Modelo LLM utilizado")
    message: Optional[str] = Field(None, description="Mensaje de respuesta obtenido de OpenRouter")
    error: Optional[str] = Field(None, description="Mensaje seguro descriptivo en caso de error")
