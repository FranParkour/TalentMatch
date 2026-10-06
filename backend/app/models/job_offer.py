from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True, default="")
    employment_type = Column(String(100), nullable=True, default="Full-time")
    experience_required = Column(String(100), nullable=True, default="")
    status = Column(String(50), nullable=False, default="active", server_default="active", index=True)

    # Selection criteria stored as JSON lists
    required_skills = Column(JSON, nullable=False, default=list)
    preferred_skills = Column(JSON, nullable=False, default=list)
    requirements = Column(JSON, nullable=False, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to CandidateCVs
    cvs = relationship("CandidateCV", back_populates="job_offer", lazy="select")

    @property
    def cvs_count(self) -> int:
        return len(self.cvs) if self.cvs else 0

    @property
    def evaluated_count(self) -> int:
        if not self.cvs:
            return 0
        return sum(1 for cv in self.cvs if cv.evaluation is not None)

    def __repr__(self) -> str:
        return f"<JobOffer(id={self.id}, title='{self.title}', status='{self.status}')>"

