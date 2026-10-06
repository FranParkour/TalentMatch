from pydantic import BaseModel, Field


class DashboardStatsResponse(BaseModel):
    """
    Métricas cuantitativas consolidadas para la vista principal del dashboard.
    """
    active_offers: int = Field(..., description="Cantidad de ofertas laborales en estado activo")
    total_cvs: int = Field(..., description="Total de currículums almacenados en el sistema")
    evaluated_cvs: int = Field(..., description="Total de currículums con evaluación completada por IA")
    pending_cvs: int = Field(..., description="Total de currículums procesados que aún no poseen evaluación")
