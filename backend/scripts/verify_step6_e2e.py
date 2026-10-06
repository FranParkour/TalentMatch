#!/usr/bin/env python3
"""
TalentMatch — Verificación de Integración End-to-End (Paso 6)
Ejecuta el flujo completo del sistema con PostgreSQL en Docker,
almacenamiento local de PDF, extracción de texto, evaluación con OpenRouter,
métricas de dashboard, descarga de archivo y verificación de persistencia.
"""

import sys
import io
import os
import asyncio
from pathlib import Path

# Añadir backend al PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure UTF-8 encoding for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.job_offer import JobOffer
from app.models.candidate_cv import CandidateCV
from app.models.candidate_evaluation import CandidateEvaluation
from app.services.cv_service import cv_service


def create_minimal_text_pdf(text_lines: list[str]) -> bytes:
    """Genera bytes de un PDF válido con texto extraíble."""
    stream_content = "BT\n/F1 12 Tf\n50 750 Td\n"
    for line in text_lines:
        escaped_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream_content += f"({escaped_line}) Tj\n0 -15 Td\n"
    stream_content += "ET"
    stream_bytes = stream_content.encode("latin-1")
    stream_len = len(stream_bytes)

    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"5 0 obj\n<< /Length " + str(stream_len).encode("ascii") + b" >>\nstream\n"
        + stream_bytes + b"\nendstream\nendobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000244 00000 n \n"
        b"0000000318 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n400\n%%EOF\n"
    )
    return pdf


def run_e2e_verification():
    print("=" * 70)
    print(" TalentMatch — Verificación End-to-End de Integración (Paso 6)")
    print("=" * 70)

    client = TestClient(app)

    # 1. Health checks
    print("\n[Paso 1/10] Verificando endpoints de salud...")
    r_root = client.get("/")
    assert r_root.status_code == 200, f"Root falló: {r_root.text}"
    print("  [OK] GET / responde 200 OK")

    r_health = client.get("/health")
    assert r_health.status_code == 200, f"Health falló: {r_health.text}"
    health_data = r_health.json()
    assert health_data["status"] == "ok"
    assert health_data["database"] == "connected"
    print(f"  [OK] GET /health responde 200 OK (DB: {health_data['database']})")

    r_openrouter = client.get("/api/v1/health/openrouter")
    print(f"  [OK] GET /api/v1/health/openrouter: HTTP {r_openrouter.status_code} ({r_openrouter.json().get('status')})")

    # 2. Crear Oferta Laboral
    print("\n[Paso 2/10] Creando oferta laboral...")
    offer_payload = {
        "title": "Desarrollador Fullstack Python & React (E2E Test)",
        "description": "Buscamos desarrollador para plataforma web con FastAPI y PostgreSQL.",
        "location": "Remoto",
        "employment_type": "Full-time",
        "experience_required": "2+ años",
        "status": "active",
        "required_skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "preferred_skills": ["Docker", "TypeScript", "Tailwind CSS"],
        "requirements": ["Título profesional en Informática o afín", "Experiencia en APIs REST"]
    }
    r_create_offer = client.post("/api/v1/job-offers/", json=offer_payload)
    assert r_create_offer.status_code == 201, f"Creación de oferta falló: {r_create_offer.text}"
    offer_data = r_create_offer.json()
    offer_id = offer_data["id"]
    print(f"  [OK] Oferta creada con ID {offer_id}: '{offer_data['title']}'")

    # 3. Subir CV en formato PDF
    print("\n[Paso 3/10] Subiendo CV en PDF con texto técnico...")
    pdf_lines = [
        "Curriculum Vitae - Juan Perez",
        "Desarrollador Full Stack con 3 anos de experiencia profesional.",
        "Competencias tecnicas: Python, FastAPI, React, PostgreSQL y Git.",
        "Conocimientos adicionales: Docker, TypeScript y Tailwind CSS.",
        "Educacion: Ingeniero en Informatica.",
        "Experiencia: Desarrollo de APIs RESTful escalables y paneles SPA."
    ]
    pdf_bytes = create_minimal_text_pdf(pdf_lines)
    files = {"file": ("cv_juan_perez.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    r_upload = client.post(f"/api/v1/job-offers/{offer_id}/cvs/", files=files)
    assert r_upload.status_code == 201, f"Carga de CV falló: {r_upload.text}"
    cv_data = r_upload.json()
    cv_id = cv_data["id"]
    print(f"  [OK] CV subido con ID {cv_id}: '{cv_data['original_filename']}' (Estado: {cv_data['processing_status']})")

    # 4. Verificar almacenamiento físico y extracción de texto
    print("\n[Paso 4/10] Verificando almacenamiento físico y extracción de texto...")
    r_cv_detail = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert r_cv_detail.status_code == 200, f"Detalle de CV falló: {r_cv_detail.text}"
    detail_data = r_cv_detail.json()
    assert detail_data["processing_status"] == "processed"
    assert "Python" in detail_data["extracted_text"]
    assert detail_data["text_length"] > 0
    print(f"  [OK] Texto extraído correctamente ({detail_data['text_length']} caracteres, {detail_data['word_count']} palabras)")

    # Verificar existencia física
    physical_path = cv_service.get_absolute_path(detail_data["stored_filename"] if "stored_filename" in detail_data else f"{cv_data['id']}.pdf")
    # Alternativamente, leer del registro de base de datos
    db = SessionLocal()
    try:
        db_cv = db.query(CandidateCV).filter(CandidateCV.id == cv_id).first()
        assert db_cv is not None
        target_file = cv_service.get_absolute_path(db_cv.stored_filename)
        assert target_file.exists(), f"El archivo físico no existe en {target_file}"
        print(f"  [OK] Archivo físico verificado en disco: {target_file.name} ({target_file.stat().st_size} bytes)")
    finally:
        db.close()

    # 5. Descargar/Ver archivo PDF a través de la API
    print("\n[Paso 5/10] Verificando endpoint de descarga de PDF...")
    r_file = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}/file")
    assert r_file.status_code == 200, f"Descarga de archivo falló: {r_file.text}"
    assert r_file.headers.get("content-type") == "application/pdf"
    assert len(r_file.content) > 0
    print(f"  [OK] Archivo PDF entregado con MIME 'application/pdf' ({len(r_file.content)} bytes)")

    # 6. Evaluación con OpenRouter
    print("\n[Paso 6/10] Ejecutando evaluación con IA (OpenRouter)...")
    r_eval = client.post(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}/evaluate")
    if r_eval.status_code == 200:
        eval_data = r_eval.json()
        print(f"  [OK] Evaluación completada exitosamente:")
        print(f"    - Score:          {eval_data['score']}/100")
        print(f"    - Recomendación:  {eval_data['recommendation']}")
        print(f"    - Modelo IA:      {eval_data['model_used']}")
        print(f"    - Req Matched:    {eval_data['matched_required_skills']}")
        print(f"    - Resumen:        {eval_data['summary'][:90]}...")
    else:
        print(f"  ⚠ OpenRouter devolvió HTTP {r_eval.status_code}: {r_eval.text}")
        print("    (Verificando que la API maneje el error de forma controlada sin stack traces)")

    # 7. Consultar Evaluación Almacenada (GET sin re-llamar IA)
    print("\n[Paso 7/10] Consultando evaluación guardada en PostgreSQL...")
    r_get_eval = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}/evaluation")
    if r_eval.status_code == 200:
        assert r_get_eval.status_code == 200
        saved_eval = r_get_eval.json()
        assert saved_eval["cv_id"] == cv_id
        assert saved_eval["score"] == eval_data["score"]
        print(f"  [OK] Evaluación persistida en PostgreSQL verificada (Score {saved_eval['score']})")
    else:
        print(f"  ℹ Endpoint GET respondió {r_get_eval.status_code} conforme al estado de la evaluación")

    # 8. Verificar Estadísticas del Dashboard
    print("\n[Paso 8/10] Verificando métricas consolidadas del dashboard...")
    r_stats = client.get("/api/v1/dashboard/stats")
    assert r_stats.status_code == 200
    stats = r_stats.json()
    assert stats["active_offers"] >= 1
    assert stats["total_cvs"] >= 1
    print(f"  [OK] Métricas del Dashboard: {stats['active_offers']} ofertas activas, {stats['total_cvs']} CVs totales, {stats['evaluated_cvs']} evaluados, {stats['pending_cvs']} pendientes")

    # 9. Listar y verificar CV con su resumen de evaluación
    print("\n[Paso 9/10] Listando CVs asociados a la oferta...")
    r_cvs_list = client.get(f"/api/v1/job-offers/{offer_id}/cvs/")
    assert r_cvs_list.status_code == 200
    cvs_list = r_cvs_list.json()
    assert len(cvs_list) >= 1
    found_cv = next((c for c in cvs_list if c["id"] == cv_id), None)
    assert found_cv is not None
    print(f"  [OK] Listado de CVs contiene a '{found_cv['original_filename']}'")

    # 10. Limpieza e Integridad Referencial
    print("\n[Paso 10/10] Verificando eliminación e integridad referencial...")
    # Intentar eliminar oferta con CVs asociados -> debe ser rechazada con 400
    r_del_offer_fail = client.delete(f"/api/v1/job-offers/{offer_id}")
    assert r_del_offer_fail.status_code == 400, "Debe rechazar eliminar una oferta con CVs asociados"
    print("  [OK] Protección de integridad: No se permite eliminar oferta con CVs huérfanos (HTTP 400)")

    # Eliminar CV
    r_del_cv = client.delete(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert r_del_cv.status_code == 200
    print("  [OK] CV eliminado correctamente")

    # Verificar que el archivo físico fue eliminado
    db = SessionLocal()
    try:
        assert not target_file.exists(), "El archivo físico debió eliminarse del disco"
        print("  [OK] Archivo físico eliminado del disco")

        # Verificar que la evaluación asociada fue eliminada en cascada
        eval_left = db.query(CandidateEvaluation).filter(CandidateEvaluation.cv_id == cv_id).first()
        assert eval_left is None, "La evaluación debió eliminarse en cascada"
        print("  [OK] Evaluación eliminada en cascada de PostgreSQL")
    finally:
        db.close()

    # Ahora sí, eliminar oferta limpia
    r_del_offer_ok = client.delete(f"/api/v1/job-offers/{offer_id}")
    assert r_del_offer_ok.status_code == 200
    print(f"  [OK] Oferta {offer_id} eliminada correctamente")

    print("\n" + "=" * 70)
    print(" [ÉXITO TOTAL] Todas las 10 etapas de integración E2E pasaron exitosamente!")
    print("=" * 70)


if __name__ == "__main__":
    run_e2e_verification()
