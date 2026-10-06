from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


JobOfferStatus = Literal["active", "inactive"]


def clean_string_list(items: Optional[List[str]]) -> List[str]:
    """Helper to clean string items, strip whitespace, and remove empty entries."""
    if not items:
        return []
    cleaned = [item.strip() for item in items if isinstance(item, str) and item.strip()]
    return cleaned


class JobOfferBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título del cargo")
    description: str = Field(..., min_length=1, description="Descripción detallada de la oferta")
    location: Optional[str] = Field(default="", max_length=255, description="Ubicación (ej: Remoto, Santiago)")
    employment_type: Optional[str] = Field(default="Full-time", max_length=100, description="Tipo de jornada (Full-time, Part-time, etc.)")
    experience_required: Optional[str] = Field(default="", max_length=100, description="Nivel de experiencia requerido")
    status: JobOfferStatus = Field(default="active", description="Estado de la oferta ('active' o 'inactive')")
    required_skills: List[str] = Field(default_factory=list, description="Habilidades técnicas obligatorias")
    preferred_skills: List[str] = Field(default_factory=list, description="Habilidades deseadas / plus")
    requirements: List[str] = Field(default_factory=list, description="Requisitos generales o académicos")

    @field_validator("title", "description", mode="before")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                raise ValueError("El campo no puede estar vacío ni contener solo espacios")
            return v_stripped
        return v

    @field_validator("location", "employment_type", "experience_required", mode="before")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> str:
        if isinstance(v, str):
            return v.strip()
        return "" if v is None else str(v)

    @field_validator("required_skills", "preferred_skills", "requirements", mode="before")
    @classmethod
    def validate_and_clean_lists(cls, v: Optional[List[str]]) -> List[str]:
        return clean_string_list(v)


class JobOfferCreate(JobOfferBase):
    pass


class JobOfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: Optional[str] = Field(None, max_length=100)
    experience_required: Optional[str] = Field(None, max_length=100)
    status: Optional[JobOfferStatus] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    requirements: Optional[List[str]] = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def validate_non_empty_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if isinstance(v, str):
                v_stripped = v.strip()
                if not v_stripped:
                    raise ValueError("El campo no puede estar vacío ni contener solo espacios")
                return v_stripped
        return v

    @field_validator("location", "employment_type", "experience_required", mode="before")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

    @field_validator("required_skills", "preferred_skills", "requirements", mode="before")
    @classmethod
    def validate_and_clean_lists(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            return clean_string_list(v)
        return v


class JobOfferResponse(JobOfferBase):
    id: int
    created_at: datetime
    updated_at: datetime
    cvs_count: int = Field(default=0, description="Cantidad total de CVs asociados a la oferta")
    evaluated_count: int = Field(default=0, description="Cantidad de CVs evaluados mediante IA")

    model_config = ConfigDict(from_attributes=True)


class JobOfferListResponse(BaseModel):
    items: List[JobOfferResponse]
    total: int
