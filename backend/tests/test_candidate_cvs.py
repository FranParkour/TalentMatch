import io
import os
import pytest
from fastapi.testclient import TestClient
import pypdf

from app.core.config import settings
from app.services.cv_service import cv_service


def create_minimal_text_pdf_bytes(text_lines: list[str]) -> bytes:
    """
    Generates valid PDF bytes containing text operators so pypdf can extract it.
    """
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


def create_blank_pdf_bytes() -> bytes:
    """
    Creates a valid PDF with zero text content (e.g. blank page / scanned mockup).
    """
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


@pytest.fixture
def created_job_offer(client: TestClient) -> dict:
    """Fixture to ensure a fresh job offer is available for CV testing."""
    response = client.post("/api/v1/job-offers/", json={
        "title": "Ingeniero Fullstack Python/React",
        "description": "Búsqueda activa para proyecto de título TalentMatch.",
        "required_skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "status": "active"
    })
    assert response.status_code == 201
    return response.json()


def test_upload_valid_pdf_success(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    pdf_bytes = create_minimal_text_pdf_bytes([
        "Juan Perez",
        "Ingeniero en Informatica",
        "Experiencia en FastAPI y React"
    ])

    response = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Juan_Perez_CV.pdf", pdf_bytes, "application/pdf")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["job_offer_id"] == offer_id
    assert data["original_filename"] == "Juan_Perez_CV.pdf"
    assert data["processing_status"] == "processed"
    assert data["error_message"] is None
    assert data["file_size"] == len(pdf_bytes)
    assert data["mime_type"] == "application/pdf"
    assert "file_size_formatted" in data

    # Verify physical file existence in storage
    cv_id = data["id"]
    detail_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert "Juan Perez" in detail_data["extracted_text"]
    assert detail_data["word_count"] > 0


def test_upload_blank_scanned_pdf_handled(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    blank_pdf = create_blank_pdf_bytes()

    response = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Scanned_CV.pdf", blank_pdf, "application/pdf")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["processing_status"] == "failed"
    assert data["error_message"] is not None
    assert "escaneado" in data["error_message"].lower() or "texto" in data["error_message"].lower()


def test_upload_non_pdf_rejected(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    txt_content = b"Este es un archivo de texto simple no soportado."

    response = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("curriculum.txt", txt_content, "text/plain")}
    )

    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


def test_upload_corrupted_pdf_rejected(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    corrupted_bytes = b"%PDF-1.4 fake header but corrupted body \x00\xff\xfe"

    response = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("corrupted.pdf", corrupted_bytes, "application/pdf")}
    )

    assert response.status_code == 400
    assert "corrupta" in response.json()["detail"].lower() or "válido" in response.json()["detail"].lower()


def test_upload_cv_to_non_existent_offer(client: TestClient):
    pdf_bytes = create_minimal_text_pdf_bytes(["Test Candidate"])

    response = client.post(
        "/api/v1/job-offers/99999/cvs/",
        files={"file": ("Test.pdf", pdf_bytes, "application/pdf")}
    )

    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]


def test_get_cvs_list_for_job_offer(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]

    # Upload two CVs
    pdf1 = create_minimal_text_pdf_bytes(["Candidato Uno", "Python Dev"])
    pdf2 = create_minimal_text_pdf_bytes(["Candidato Dos", "React Dev"])

    client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("cv1.pdf", pdf1, "application/pdf")}
    )
    client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("cv2.pdf", pdf2, "application/pdf")}
    )

    response = client.get(f"/api/v1/job-offers/{offer_id}/cvs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    # Verify lightweight list does not include extracted_text
    assert "extracted_text" not in data[0]
    assert "original_filename" in data[0]


def test_get_cv_detail_and_not_found(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    pdf_bytes = create_minimal_text_pdf_bytes(["Maria Gonzalez", "Data Engineer"])

    upload_res = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Maria_CV.pdf", pdf_bytes, "application/pdf")}
    )
    cv_id = upload_res.json()["id"]

    # Get valid detail
    detail_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["original_filename"] == "Maria_CV.pdf"
    assert "Maria Gonzalez" in detail["extracted_text"]

    # Not found in offer
    nf_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/88888")
    assert nf_res.status_code == 404


def test_download_cv_file(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    pdf_bytes = create_minimal_text_pdf_bytes(["Pedro Soto", "SysAdmin"])

    upload_res = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Pedro_Soto_CV.pdf", pdf_bytes, "application/pdf")}
    )
    cv_id = upload_res.json()["id"]

    file_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}/file")
    assert file_res.status_code == 200
    assert file_res.headers["content-type"] == "application/pdf"
    assert len(file_res.content) > 0


def test_delete_cv(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    pdf_bytes = create_minimal_text_pdf_bytes(["Candidato Para Eliminar"])

    upload_res = client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Eliminar_CV.pdf", pdf_bytes, "application/pdf")}
    )
    cv_id = upload_res.json()["id"]

    # Delete CV
    del_res = client.delete(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Check that CV is gone from DB
    get_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}")
    assert get_res.status_code == 404

    # Check that file download fails with 404
    file_res = client.get(f"/api/v1/job-offers/{offer_id}/cvs/{cv_id}/file")
    assert file_res.status_code == 404


def test_delete_job_offer_blocked_when_cvs_exist(client: TestClient, created_job_offer: dict):
    offer_id = created_job_offer["id"]
    pdf_bytes = create_minimal_text_pdf_bytes(["Candidato Activo"])

    # Upload CV
    client.post(
        f"/api/v1/job-offers/{offer_id}/cvs/",
        files={"file": ("Activo_CV.pdf", pdf_bytes, "application/pdf")}
    )

    # Attempting to delete job offer with linked CV should fail with 400 Bad Request
    del_offer_res = client.delete(f"/api/v1/job-offers/{offer_id}")
    assert del_offer_res.status_code == 400
    assert "asociado" in del_offer_res.json()["detail"].lower()
