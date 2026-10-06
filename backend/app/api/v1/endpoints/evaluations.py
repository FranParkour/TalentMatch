from typing import List
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.job_offer_service import job_offer_service
from app.services.cv_service import cv_service
from app.services.cv_classifier_service import cv_classifier_service
from app.models.candidate_cv import CandidateCV
from app.schemas.candidate_evaluation import (
    CandidateEvaluationResponse,
    CandidateEvaluationBatchItem,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_validated_job_offer_and_cv(job_offer_id: int, cv_id: int, db: Session):
    """
    Función auxiliar para validar la existencia de la oferta y que el CV le pertenezca.
    """
    offer = job_offer_service.get_by_id(db, job_offer_id=job_offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Oferta laboral con ID {job_offer_id} no encontrada",
        )

    cv = cv_service.get_by_id(db, job_offer_id=job_offer_id, cv_id=cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Currículum con ID {cv_id} no encontrado en la oferta laboral {job_offer_id}",
        )

    return offer, cv


@router.post(
    "/job-offers/{job_offer_id}/cvs/{cv_id}/evaluate",
    response_model=CandidateEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluar y clasificar un CV individual",
    description="Compara el contenido extraído del CV contra los requisitos de la oferta laboral usando IA y guarda el resultado estructurado.",
)
async def evaluate_candidate_cv(
    job_offer_id: int,
    cv_id: int,
    db: Session = Depends(get_db),
):
    offer, cv = _get_validated_job_offer_and_cv(job_offer_id, cv_id, db)
    evaluation = await cv_classifier_service.evaluate_cv(db=db, job_offer=offer, cv=cv)
    return evaluation


@router.get(
    "/job-offers/{job_offer_id}/cvs/{cv_id}/evaluation",
    response_model=CandidateEvaluationResponse,
    summary="Obtener la evaluación existente de un CV",
    description="Recupera la evaluación almacenada en la base de datos para el CV especificado sin volver a invocar el modelo.",
)
def get_candidate_cv_evaluation(
    job_offer_id: int,
    cv_id: int,
    db: Session = Depends(get_db),
):
    _get_validated_job_offer_and_cv(job_offer_id, cv_id, db)
    evaluation = cv_classifier_service.get_evaluation_by_cv(db=db, cv_id=cv_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El currículum con ID {cv_id} aún no ha sido evaluado.",
        )
    return evaluation


@router.post(
    "/job-offers/{job_offer_id}/evaluate",
    response_model=List[CandidateEvaluationBatchItem],
    summary="Evaluar en lote todos los CVs pendientes de una oferta",
    description="Procesa de forma secuencial todos los CVs en estado 'processed' asociados a la oferta laboral que no posean evaluación activa.",
)
async def evaluate_all_job_offer_cvs(
    job_offer_id: int,
    db: Session = Depends(get_db),
):
    offer = job_offer_service.get_by_id(db, job_offer_id=job_offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Oferta laboral con ID {job_offer_id} no encontrada",
        )

    cvs = cv_service.get_by_job_offer(db, job_offer_id=job_offer_id)
    results: List[CandidateEvaluationBatchItem] = []

    for cv in cvs:
        # Si ya cuenta con una evaluación activa, omitir para optimizar llamadas al modelo
        if cv.evaluation is not None:
            results.append(
                CandidateEvaluationBatchItem(
                    cv_id=cv.id,
                    status="skipped",
                    score=cv.evaluation.score,
                    recommendation=cv.evaluation.recommendation,
                    message="El CV ya cuenta con una evaluación activa.",
                )
            )
            continue

        # Si no está procesado o no tiene texto, omitir con aviso
        if cv.processing_status != "processed" or not cv.extracted_text or not cv.extracted_text.strip():
            results.append(
                CandidateEvaluationBatchItem(
                    cv_id=cv.id,
                    status="skipped",
                    message="El CV no está en estado 'processed' o no contiene texto extraído.",
                )
            )
            continue

        try:
            eval_res = await cv_classifier_service.evaluate_cv(db=db, job_offer=offer, cv=cv)
            results.append(
                CandidateEvaluationBatchItem(
                    cv_id=cv.id,
                    status="success",
                    score=eval_res.score,
                    recommendation=eval_res.recommendation,
                    message="Evaluación completada exitosamente.",
                )
            )
        except Exception as exc:
            logger.error(f"Fallo al evaluar CV ID {cv.id} en lote: {str(exc)}")
            results.append(
                CandidateEvaluationBatchItem(
                    cv_id=cv.id,
                    status="error",
                    message=f"Error durante la evaluación: {str(exc)}",
                )
            )

    return results
