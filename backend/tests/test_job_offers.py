import pytest
from fastapi.testclient import TestClient


def test_create_job_offer_success(client: TestClient):
    payload = {
        "title": "Desarrollador Backend Python Senior",
        "description": "Buscamos un desarrollador experimentado para construir microservicios y APIs robustas.",
        "location": "Remoto (Chile)",
        "employment_type": "Full-time",
        "experience_required": "Senior (4+ años)",
        "status": "active",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": ["Docker", "AWS", "Redis"],
        "requirements": ["Título profesional en Ingeniería en Informática o afín", "Experiencia con arquitecturas REST"]
    }
    response = client.post("/api/v1/job-offers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["required_skills"] == ["Python", "FastAPI", "PostgreSQL"]
    assert data["preferred_skills"] == ["Docker", "AWS", "Redis"]
    assert data["status"] == "active"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_job_offer_validation_failures(client: TestClient):
    # Empty title
    response = client.post("/api/v1/job-offers/", json={
        "title": "   ",
        "description": "Descripción válida"
    })
    assert response.status_code == 422

    # Missing description
    response = client.post("/api/v1/job-offers/", json={
        "title": "Título válido"
    })
    assert response.status_code == 422

    # Invalid status value
    response = client.post("/api/v1/job-offers/", json={
        "title": "Título válido",
        "description": "Descripción válida",
        "status": "invalid_status"
    })
    assert response.status_code == 422


def test_get_all_job_offers(client: TestClient):
    # Create two job offers
    client.post("/api/v1/job-offers/", json={
        "title": "Oferta 1",
        "description": "Descripción 1",
        "status": "active"
    })
    client.post("/api/v1/job-offers/", json={
        "title": "Oferta 2",
        "description": "Descripción 2",
        "status": "inactive"
    })

    # Retrieve all
    response = client.get("/api/v1/job-offers/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Test filtering by status
    response_active = client.get("/api/v1/job-offers/?status=active")
    assert response_active.status_code == 200
    data_active = response_active.json()
    assert len(data_active) == 1
    assert data_active[0]["title"] == "Oferta 1"


def test_get_job_offer_by_id(client: TestClient):
    create_res = client.post("/api/v1/job-offers/", json={
        "title": "Frontend React Engineer",
        "description": "Desarrollo de interfaces accesibles y de alto rendimiento.",
        "required_skills": ["React", "TypeScript", "Tailwind CSS"]
    })
    created_id = create_res.json()["id"]

    # Existing ID
    get_res = client.get(f"/api/v1/job-offers/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Frontend React Engineer"

    # Non-existing ID
    non_existing = client.get("/api/v1/job-offers/99999")
    assert non_existing.status_code == 404
    assert "no encontrada" in non_existing.json()["detail"]


def test_update_job_offer(client: TestClient):
    create_res = client.post("/api/v1/job-offers/", json={
        "title": "Data Scientist",
        "description": "Modelado predictivo y LLMs.",
        "status": "active"
    })
    offer_id = create_res.json()["id"]

    # Update title and status
    update_res = client.put(f"/api/v1/job-offers/{offer_id}", json={
        "title": "Lead Data Scientist",
        "status": "inactive",
        "required_skills": ["Python", "PyTorch", "Hugging Face"]
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["title"] == "Lead Data Scientist"
    assert updated_data["status"] == "inactive"
    assert updated_data["required_skills"] == ["Python", "PyTorch", "Hugging Face"]
    assert updated_data["description"] == "Modelado predictivo y LLMs."

    # Update non-existing
    update_non_existing = client.put("/api/v1/job-offers/99999", json={"title": "Nuevo"})
    assert update_non_existing.status_code == 404


def test_delete_job_offer(client: TestClient):
    create_res = client.post("/api/v1/job-offers/", json={
        "title": "DevOps Engineer",
        "description": "CI/CD y Kubernetes."
    })
    offer_id = create_res.json()["id"]

    # Delete existing
    delete_res = client.delete(f"/api/v1/job-offers/{offer_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["success"] is True

    # Verify it is deleted
    get_res = client.get(f"/api/v1/job-offers/{offer_id}")
    assert get_res.status_code == 404

    # Delete non-existing returns 404
    delete_again = client.delete(f"/api/v1/job-offers/{offer_id}")
    assert delete_again.status_code == 404
