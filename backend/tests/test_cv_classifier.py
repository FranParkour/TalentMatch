import json
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.job_offer import JobOffer
from app.models.candidate_cv import CandidateCV
from app.models.candidate_evaluation import CandidateEvaluation
from app.services.openrouter_service import openrouter_service


@pytest.fixture
def sample_job_offer(db_session: Session) -> JobOffer:
    offer = JobOffer(
        title="Desarrollador Backend Python Senior",
        description="Buscamos ingeniero con experiencia sólida en FastAPI, PostgreSQL y Docker.",
        location="Santiago, Chile",
        employment_type="Remoto",
        experience_required="3+ años",
        status="active",
        required_skills=["Python", "FastAPI", "PostgreSQL"],
        preferred_skills=["Docker", "AWS", "Git"],
        requirements=["Título en Informática o equivalente", "Experiencia con arquitecturas REST"],
    )
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)
    return offer


@pytest.fixture
def sample_candidate_cv(db_session: Session, sample_job_offer: JobOffer) -> CandidateCV:
    cv = CandidateCV(
        job_offer_id=sample_job_offer.id,
        original_filename="cv_candidato_prueba.pdf",
        stored_filename="uuid-candidato-prueba.pdf",
        file_path="storage/cvs/uuid-candidato-prueba.pdf",
        file_size=20480,
        mime_type="application/pdf",
        extracted_text=(
            "Juan Pérez - Desarrollador de Software\n"
            "Experiencia laboral de 4 años desarrollando APIs con Python y FastAPI.\n"
            "Manejo avanzado de PostgreSQL, SQLAlchemy, Docker y control de versiones con Git.\n"
            "Ingeniero en Informática titulado de la Universidad de Chile."
        ),
        processing_status="processed",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)
    return cv


VALID_AI_EVALUATION_JSON = json.dumps({
    "score": 85,
    "recommendation": "recommended",
    "matched_required_skills": ["Python", "FastAPI", "PostgreSQL"],
    "missing_required_skills": [],
    "matched_preferred_skills": ["Docker", "Git"],
    "experience_analysis": "El candidato cuenta con 4 años de experiencia en desarrollo backend con Python y FastAPI, cumpliendo los 3 años requeridos.",
    "requirements_analysis": "Posee el título de Ingeniero en Informática y experiencia comprobada en APIs REST.",
    "summary": "Perfil altamente compatible con los requerimientos técnicos y experiencia del cargo."
})


def test_evaluate_cv_success(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV, db_session: Session):
    """
    Prueba 1: CV procesado + oferta válida -> evaluación exitosa y persistencia en DB.
    """
    mock_response = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "content": f"```json\n{VALID_AI_EVALUATION_JSON}\n```"
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
        assert response.status_code == 200
        data = response.json()

        assert data["score"] == 85
        assert data["recommendation"] == "recommended"
        assert "Python" in data["matched_required_skills"]
        assert "FastAPI" in data["matched_required_skills"]
        assert "PostgreSQL" in data["matched_required_skills"]
        assert "Docker" in data["matched_preferred_skills"]
        assert data["model_used"] == "openrouter/free"
        assert data["cv_id"] == sample_candidate_cv.id

        # Verificar persistencia en base de datos
        db_eval = db_session.query(CandidateEvaluation).filter_by(cv_id=sample_candidate_cv.id).first()
        assert db_eval is not None
        assert db_eval.score == 85
        assert db_eval.recommendation == "recommended"


def test_evaluate_cv_without_extracted_text(client: TestClient, sample_job_offer: JobOffer, db_session: Session):
    """
    Prueba 2: CV sin texto extraído -> no permitir evaluación (HTTP 400).
    """
    empty_cv = CandidateCV(
        job_offer_id=sample_job_offer.id,
        original_filename="cv_sin_texto.pdf",
        stored_filename="uuid-cv-sin-texto.pdf",
        file_path="storage/cvs/uuid-cv-sin-texto.pdf",
        file_size=1024,
        mime_type="application/pdf",
        extracted_text=None,
        processing_status="processed",
    )
    db_session.add(empty_cv)
    db_session.commit()
    db_session.refresh(empty_cv)

    response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{empty_cv.id}/evaluate")
    assert response.status_code == 400
    assert "no contiene texto extraído" in response.json()["detail"]


def test_evaluate_cv_unprocessed_status(client: TestClient, sample_job_offer: JobOffer, db_session: Session):
    """
    Prueba 3: CV con processing_status != 'processed' -> error 400.
    """
    unprocessed_cv = CandidateCV(
        job_offer_id=sample_job_offer.id,
        original_filename="cv_pendiente.pdf",
        stored_filename="uuid-cv-pendiente.pdf",
        file_path="storage/cvs/uuid-cv-pendiente.pdf",
        file_size=1024,
        mime_type="application/pdf",
        extracted_text="Texto extraído",
        processing_status="uploaded",
    )
    db_session.add(unprocessed_cv)
    db_session.commit()
    db_session.refresh(unprocessed_cv)

    response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{unprocessed_cv.id}/evaluate")
    assert response.status_code == 400
    assert "no está en estado procesado" in response.json()["detail"]


def test_evaluate_cv_not_found(client: TestClient, sample_job_offer: JobOffer):
    """
    Prueba 4: CV inexistente -> HTTP 404.
    """
    response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/99999/evaluate")
    assert response.status_code == 404
    assert "no encontrado" in response.json()["detail"]


def test_evaluate_cv_wrong_job_offer(client: TestClient, sample_candidate_cv: CandidateCV, db_session: Session):
    """
    Prueba 5: CV perteneciente a otra oferta laboral -> HTTP 404.
    """
    other_offer = JobOffer(
        title="Diseñador UI/UX",
        description="Buscamos diseñador Figma.",
        status="active",
        required_skills=["Figma"],
    )
    db_session.add(other_offer)
    db_session.commit()
    db_session.refresh(other_offer)

    response = client.post(f"/api/v1/job-offers/{other_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
    assert response.status_code == 404
    assert "no encontrado en la oferta laboral" in response.json()["detail"]


def test_evaluate_cv_ai_invalid_json(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV):
    """
    Prueba 6: Respuesta de IA con JSON inválido o malformado -> HTTP 502 y sin persistencia parcial.
    """
    mock_response = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "content": "Lo siento, como modelo de lenguaje no puedo procesar este documento de manera estructurada."
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
        assert response.status_code == 502
        assert "no contiene un formato JSON válido" in response.json()["detail"] or "inválida" in response.json()["detail"]


def test_evaluate_cv_ai_score_out_of_range(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV):
    """
    Prueba 7: Score devuelto por la IA fuera del rango 0-100 -> validación Pydantic falla con HTTP 502.
    """
    invalid_score_json = json.dumps({
        "score": 125,  # Fuera de rango
        "recommendation": "recommended",
        "matched_required_skills": ["Python"],
        "missing_required_skills": [],
        "matched_preferred_skills": [],
        "experience_analysis": "Buena experiencia",
        "requirements_analysis": "Cumple requisitos",
        "summary": "Buen candidato"
    })

    mock_response = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "content": invalid_score_json
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
        assert response.status_code == 502
        assert "respuesta estructurada inválida" in response.json()["detail"]


def test_evaluate_cv_threshold_normalization(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV):
    """
    Prueba 8: Normalización consistente de recomendaciones basada en los umbrales configurados.
    Si el score es 50 pero la IA devolvió "recommended", el backend normaliza a "not_recommended".
    """
    divergent_json = json.dumps({
        "score": 50,  # Menor a 60
        "recommendation": "recommended",  # Inconsistente con score < 60
        "matched_required_skills": [],
        "missing_required_skills": ["Python", "FastAPI"],
        "matched_preferred_skills": [],
        "experience_analysis": "Poca experiencia relevante.",
        "requirements_analysis": "Faltan requisitos indispensables.",
        "summary": "Candidato no cumple con los requisitos base."
    })

    mock_response = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "content": divergent_json
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 50
        assert data["recommendation"] == "not_recommended"


def test_evaluate_cv_openrouter_error(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV):
    """
    Prueba 9: Error de conexión o autenticación de OpenRouter -> HTTP 502 sin filtrar credenciales.
    """
    mock_response = {
        "status": "error",
        "provider": "openrouter",
        "model": "openrouter/free",
        "error": "Error de autenticación con OpenRouter: API Key inválida o sin permisos."
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluate")
        assert response.status_code == 502
        assert "Error al evaluar con OpenRouter" in response.json()["detail"]


def test_get_cv_evaluation_endpoint(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV, db_session: Session):
    """
    Prueba 10: GET evaluation recupera la evaluación guardada sin invocar el LLM.
    Si no existe, devuelve 404.
    """
    # 1. Cuando aún no existe evaluación
    response_not_found = client.get(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluation")
    assert response_not_found.status_code == 404

    # 2. Creamos una evaluación directamente en la BD
    evaluation = CandidateEvaluation(
        cv_id=sample_candidate_cv.id,
        score=90,
        recommendation="recommended",
        matched_required_skills=["Python", "FastAPI"],
        missing_required_skills=[],
        matched_preferred_skills=["Docker"],
        experience_analysis="Excelente trayectoria",
        requirements_analysis="Cumple 100%",
        summary="Candidato sobresaliente",
        model_used="openrouter/free"
    )
    db_session.add(evaluation)
    db_session.commit()

    # 3. Consultamos el endpoint GET
    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        response_success = client.get(f"/api/v1/job-offers/{sample_job_offer.id}/cvs/{sample_candidate_cv.id}/evaluation")
        assert response_success.status_code == 200
        data = response_success.json()
        assert data["score"] == 90
        assert data["recommendation"] == "recommended"
        assert data["summary"] == "Candidato sobresaliente"
        # Comprobar que OpenRouter NO fue llamado
        mock_generate.assert_not_called()


def test_batch_evaluate_job_offer_cvs(client: TestClient, sample_job_offer: JobOffer, sample_candidate_cv: CandidateCV, db_session: Session):
    """
    Prueba 11: Endpoint masivo de evaluación evalúa secuencialmente y maneja CVs omitidos/fallidos.
    """
    # Agregar un segundo CV sin procesar (debe ser omitido 'skipped')
    skipped_cv = CandidateCV(
        job_offer_id=sample_job_offer.id,
        original_filename="cv_incompleto.pdf",
        stored_filename="uuid-cv-incompleto.pdf",
        file_path="storage/cvs/uuid-cv-incompleto.pdf",
        file_size=1024,
        mime_type="application/pdf",
        extracted_text=None,
        processing_status="failed",
    )
    db_session.add(skipped_cv)
    db_session.commit()

    mock_response = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "content": VALID_AI_EVALUATION_JSON
    }

    with patch.object(openrouter_service, "generate_chat_completion", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_response

        response = client.post(f"/api/v1/job-offers/{sample_job_offer.id}/evaluate")
        assert response.status_code == 200
        results = response.json()

        assert len(results) == 2
        success_item = next((r for r in results if r["cv_id"] == sample_candidate_cv.id), None)
        skipped_item = next((r for r in results if r["cv_id"] == skipped_cv.id), None)

        assert success_item is not None
        assert success_item["status"] == "success"
        assert success_item["score"] == 85

        assert skipped_item is not None
        assert skipped_item["status"] == "skipped"
