from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc

from app.models.job_offer import JobOffer
from app.models.candidate_cv import CandidateCV
from app.schemas.job_offer import JobOfferCreate, JobOfferUpdate


class JobOfferService:
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[JobOffer]:
        """
        Retrieve all job offers ordered by most recent first.
        Supports pagination parameters (skip, limit) and optional status filtering.
        Eagerly loads CVs and evaluations for accurate metrics without N+1 queries.
        """
        query = db.query(JobOffer).options(
            selectinload(JobOffer.cvs).selectinload(CandidateCV.evaluation)
        )
        if status:
            query = query.filter(JobOffer.status == status)
        return query.order_by(desc(JobOffer.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def count(db: Session, status: Optional[str] = None) -> int:
        """
        Count total job offers matching criteria.
        """
        query = db.query(JobOffer)
        if status:
            query = query.filter(JobOffer.status == status)
        return query.count()

    @staticmethod
    def get_by_id(db: Session, job_offer_id: int) -> Optional[JobOffer]:
        """
        Retrieve a single job offer by its primary key ID with its CVs and evaluations.
        """
        return (
            db.query(JobOffer)
            .options(selectinload(JobOffer.cvs).selectinload(CandidateCV.evaluation))
            .filter(JobOffer.id == job_offer_id)
            .first()
        )

    @staticmethod
    def create(db: Session, job_offer_in: JobOfferCreate) -> JobOffer:
        """
        Create and persist a new job offer entity.
        """
        db_obj = JobOffer(
            title=job_offer_in.title,
            description=job_offer_in.description,
            location=job_offer_in.location or "",
            employment_type=job_offer_in.employment_type or "Full-time",
            experience_required=job_offer_in.experience_required or "",
            status=job_offer_in.status,
            required_skills=job_offer_in.required_skills,
            preferred_skills=job_offer_in.preferred_skills,
            requirements=job_offer_in.requirements,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(
        db: Session,
        db_obj: JobOffer,
        job_offer_in: JobOfferUpdate
    ) -> JobOffer:
        """
        Update an existing job offer with provided fields.
        """
        update_data = job_offer_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, db_obj: JobOffer) -> None:
        """
        Physically delete a job offer from database after verifying no CVs are associated.
        """
        if db_obj.cvs and len(db_obj.cvs) > 0:
            raise ValueError(
                f"No se puede eliminar la oferta laboral porque tiene {len(db_obj.cvs)} CV(s) asociado(s). Elimine los CVs primero."
            )

        db.delete(db_obj)
        db.commit()


job_offer_service = JobOfferService()

