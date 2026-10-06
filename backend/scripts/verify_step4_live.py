#!/usr/bin/env python3
"""
Script de verificación manual de extremo a extremo para el PASO 4 (con OpenRouter real).
Utiliza datos puramente sintéticos y académicos (sin datos personales reales).
"""

import sys
import asyncio
from pathlib import Path

# Añadir el backend al path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.job_offer import JobOffer
from app.models.candidate_cv import CandidateCV
from app.services.cv_classifier_service import cv_classifier_service


async def main():
    print("=" * 65)
    print(" TalentMatch — Verificación Manual Paso 4 (OpenRouter en Vivo)")
    print("=" * 65)

    db = SessionLocal()
    try:
        # 1. Crear oferta laboral sintética de prueba
        print("[1/4] Creando oferta laboral sintética de prueba...")
        test_offer = JobOffer(
            title="Ingeniero de Software Python / FastAPI (Prueba Paso 4)",
            description="Buscamos profesional para el diseño de APIs REST escalables con PostgreSQL y Docker.",
            location="Remoto",
            employment_type="Full-time",
            experience_required="2+ años de experiencia",
            status="active",
            required_skills=["Python", "FastAPI", "PostgreSQL"],
            preferred_skills=["Docker", "Git", "Linux"],
            requirements=["Formación en Computación o afín", "Experiencia con bases de datos relacionales"],
        )
        db.add(test_offer)
        db.commit()
        db.refresh(test_offer)
        print(f"      Oferta creada con ID: {test_offer.id} ('{test_offer.title}')")

        # 2. Crear registro sintético de CV procesado
        print("[2/4] Creando registro sintético de CV procesado...")
        synthetic_cv_text = (
            "Perfil Profesional: Desarrollador Backend con 3 años de trayectoria.\n"
            "Habilidades técnicas: Dominio avanzado de Python, construcción de microservicios con FastAPI y SQLAlchemy.\n"
            "Bases de datos: PostgreSQL, diseño de esquemas, consultas SQL optimizadas.\n"
            "Herramientas: Docker para contenerización, control de versiones con Git, entornos Linux.\n"
            "Educación: Licenciado en Ciencias de la Computación."
        )
        test_cv = CandidateCV(
            job_offer_id=test_offer.id,
            original_filename="cv_sintetico_juan_prueba.pdf",
            stored_filename=f"uuid-synthetic-step4-test-{test_offer.id}.pdf",
            file_path=f"storage/cvs/uuid-synthetic-step4-test-{test_offer.id}.pdf",
            file_size=15200,
            mime_type="application/pdf",
            extracted_text=synthetic_cv_text,
            processing_status="processed",
        )
        db.add(test_cv)
        db.commit()
        db.refresh(test_cv)
        print(f"      CV creado con ID: {test_cv.id} ('{test_cv.original_filename}')")

        # 3. Invocar al motor de clasificación con OpenRouter real
        print("[3/4] Evaluando compatibilidad con OpenRouter (openrouter/free)...")
        evaluation = await cv_classifier_service.evaluate_cv(
            db=db,
            job_offer=test_offer,
            cv=test_cv
        )

        print("[4/4] Resultado de la evaluación recibido y persistido en PostgreSQL:")
        print(f"      - ID Evaluación:          {evaluation.id}")
        print(f"      - Score:                  {evaluation.score} / 100")
        print(f"      - Recomendación:          {evaluation.recommendation}")
        print(f"      - Modelo Utilizado:       {evaluation.model_used}")
        print(f"      - Habilidades Encontradas:{evaluation.matched_required_skills}")
        print(f"      - Habilidades Faltantes:  {evaluation.missing_required_skills}")
        print(f"      - Habilidades Deseadas:   {evaluation.matched_preferred_skills}")
        print(f"      - Análisis Experiencia:   {evaluation.experience_analysis[:80]}...")
        print(f"      - Resumen Ejecutivo:      {evaluation.summary[:80]}...")
        print("-" * 65)

        # 4. Verificar consulta sin volver a llamar al LLM
        persisted = cv_classifier_service.get_evaluation_by_cv(db, test_cv.id)
        assert persisted is not None, "La evaluación no se persistió en la BD."
        assert persisted.score == evaluation.score, "El score persistido no coincide."
        print("[OK] Verificación de persistencia en PostgreSQL completada con éxito.")
        print("=" * 65)

    finally:
        # Limpieza de datos de prueba
        print("Limpiando datos sintéticos de prueba de la base de datos...")
        try:
            db.query(CandidateCV).filter(CandidateCV.job_offer_id == test_offer.id).delete()
            db.query(JobOffer).filter(JobOffer.id == test_offer.id).delete()
            db.commit()
            print("Limpieza completada correctamente.")
        except Exception as e:
            db.rollback()
            print(f"Aviso durante la limpieza: {e}")
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
