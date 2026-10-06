from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.job_offer import (
    JobOfferCreate,
    JobOfferUpdate,
    JobOfferResponse,
    JobOfferStatus,
)
from app.services.job_offer_service import job_offer_service

router = APIRouter()


@router.get(
    "/",
    response_model=List[JobOfferResponse],
    summary="Listar ofertas laborales",
    description="Obtiene todas las ofertas de trabajo ordenadas cronológicamente con las más recientes primero.",
)
def get_job_offers(
    skip: int = Query(0, ge=0, description="Número de registros a omitir para paginación"),
    limit: int = Query(100, ge=1, le=1000, description="Límite máximo de registros a retornar"),
    status_filter: Optional[JobOfferStatus] = Query(None, alias="status", description="Filtrar por estado ('active' o 'inactive')"),
    db: Session = Depends(get_db),
):
    offers = job_offer_service.get_all(db, skip=skip, limit=limit, status=status_filter)
    return offers


@router.get(
    "/{offer_id}",
    response_model=JobOfferResponse,
    summary="Obtener oferta laboral por ID",
    description="Devuelve el detalle completo de una oferta de trabajo específica incluyendo sus criterios de selección.",
)
def get_job_offer(
    offer_id: int,
    db: Session = Depends(get_db),
):
    offer = job_offer_service.get_by_id(db, job_offer_id=offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Oferta laboral con ID {offer_id} no encontrada",
        )
    return offer


@router.post(
    "/",
    response_model=JobOfferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva oferta laboral",
    description="Crea y almacena una nueva convocatoria con sus requisitos y habilidades asociadas.",
)
def create_job_offer(
    job_offer_in: JobOfferCreate,
    db: Session = Depends(get_db),
):
    try:
        new_offer = job_offer_service.create(db, job_offer_in=job_offer_in)
        return new_offer
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al registrar la oferta laboral",
        ) from e


@router.put(
    "/{offer_id}",
    response_model=JobOfferResponse,
    summary="Actualizar oferta laboral",
    description="Actualiza parcialmente o totalmente la información de una oferta existente.",
)
def update_job_offer(
    offer_id: int,
    job_offer_in: JobOfferUpdate,
    db: Session = Depends(get_db),
):
    existing_offer = job_offer_service.get_by_id(db, job_offer_id=offer_id)
    if not existing_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Oferta laboral con ID {offer_id} no encontrada",
        )

    try:
        updated_offer = job_offer_service.update(
            db, db_obj=existing_offer, job_offer_in=job_offer_in
        )
        return updated_offer
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al actualizar la oferta laboral",
        ) from e


@router.delete(
    "/{offer_id}",
    summary="Eliminar oferta laboral",
    description="Elimina físicamente una oferta de la base de datos.",
)
def delete_job_offer(
    offer_id: int,
    db: Session = Depends(get_db),
):
    existing_offer = job_offer_service.get_by_id(db, job_offer_id=offer_id)
    if not existing_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Oferta laboral con ID {offer_id} no encontrada",
        )

    try:
        job_offer_service.delete(db, db_obj=existing_offer)
        return {
            "message": "Oferta laboral eliminada exitosamente",
            "id": offer_id,
            "success": True,
        }
    except ValueError as ve:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al eliminar la oferta laboral",
        ) from e

