from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job_offer import JobOffer
from app.models.candidate_cv import CandidateCV
from app.models.candidate_evaluation import CandidateEvaluation
from app.schemas.dashboard import DashboardStatsResponse

router = APIRouter()


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener métricas consolidadas del dashboard",
    description="Calcula en tiempo real el total de ofertas activas, CVs almacenados, CVs evaluados y evaluaciones pendientes.",
)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Ofertas activas
    active_offers = db.query(JobOffer).filter(JobOffer.status == "active").count()

    # 2. Total de CVs
    total_cvs = db.query(CandidateCV).count()

    # 3. CVs con evaluación completada
    evaluated_cvs = db.query(CandidateEvaluation).count()

    # 4. CVs procesados con texto que aún no han sido evaluados
    evaluated_cv_ids_subquery = db.query(CandidateEvaluation.cv_id)
    pending_cvs = (
        db.query(CandidateCV)
        .filter(
            CandidateCV.processing_status == "processed",
            ~CandidateCV.id.in_(evaluated_cv_ids_subquery)
        )
        .count()
    )

    return DashboardStatsResponse(
        active_offers=active_offers,
        total_cvs=total_cvs,
        evaluated_cvs=evaluated_cvs,
        pending_cvs=pending_cvs,
    )
