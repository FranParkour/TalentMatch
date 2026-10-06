import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import httpx
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.openrouter_service import OpenRouterService, openrouter_service


@pytest.mark.asyncio
async def test_openrouter_missing_api_key():
    """Prueba que el servicio detecta y rechaza la ejecución si la API key no está configurada."""
    with patch.object(settings, "OPENROUTER_API_KEY", None):
        service = OpenRouterService()
        assert service.is_configured() is False

        result = await service.test_connection()
        assert result["status"] == "error"
        assert result["provider"] == "openrouter"
        assert "OPENROUTER_API_KEY no está configurada" in result["error"]


@pytest.mark.asyncio
async def test_openrouter_empty_api_key():
    """Prueba que una API key vacía o con espacios se considera no configurada."""
    with patch.object(settings, "OPENROUTER_API_KEY", "   "):
        service = OpenRouterService()
        assert service.is_configured() is False

        result = await service.test_connection()
        assert result["status"] == "error"
        assert "OPENROUTER_API_KEY no está configurada" in result["error"]


@pytest.mark.asyncio
async def test_openrouter_successful_call():
    """Prueba la construcción de la petición y el procesamiento de una respuesta 200 OK."""
    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {
        "id": "gen-123",
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "OpenRouter OK"
                }
            }
        ]
    }

    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-fake-test-key"):
        service = OpenRouterService()
        assert service.is_configured() is True

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = fake_response
            result = await service.test_connection()

            assert result["status"] == "ok"
            assert result["provider"] == "openrouter"
            assert result["model"] == settings.OPENROUTER_MODEL
            assert result["message"] == "OpenRouter OK"

            # Verificar que la petición se construyó con la URL, headers y payload correctos
            mock_post.assert_called_once()
            called_url = mock_post.call_args[0][0]
            called_json = mock_post.call_args[1]["json"]
            called_headers = mock_post.call_args[1]["headers"]

            assert called_url == f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
            assert called_json["model"] == settings.OPENROUTER_MODEL
            assert called_json["messages"][0]["content"] == "Responde únicamente con: OpenRouter OK"
            assert called_headers["Authorization"] == "Bearer sk-or-v1-fake-test-key"


@pytest.mark.asyncio
async def test_openrouter_authentication_error_401():
    """Prueba el manejo de errores de autenticación (401) sin exponer credenciales."""
    fake_response = MagicMock()
    fake_response.status_code = 401

    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-invalid-secret-key"):
        service = OpenRouterService()
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = fake_response
            result = await service.test_connection()

            assert result["status"] == "error"
            assert result["provider"] == "openrouter"
            assert "Error de autenticación" in result["error"]
            # Asegurarse de que la clave jamás aparezca en el mensaje
            assert "sk-or-v1-invalid-secret-key" not in str(result)


@pytest.mark.asyncio
async def test_openrouter_rate_limit_429():
    """Prueba el manejo de error de límite de peticiones (429)."""
    fake_response = MagicMock()
    fake_response.status_code = 429

    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-key"):
        service = OpenRouterService()
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = fake_response
            result = await service.test_connection()

            assert result["status"] == "error"
            assert "Rate limit" in result["error"] or "Límite de peticiones" in result["error"]


@pytest.mark.asyncio
async def test_openrouter_server_error_503():
    """Prueba el manejo de errores de servidor remoto (5xx)."""
    fake_response = MagicMock()
    fake_response.status_code = 503

    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-key"):
        service = OpenRouterService()
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = fake_response
            result = await service.test_connection()

            assert result["status"] == "error"
            assert "HTTP 503" in result["error"]


@pytest.mark.asyncio
async def test_openrouter_timeout_exception():
    """Prueba el manejo de TimeoutException de red."""
    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-key"):
        service = OpenRouterService()
        with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
            result = await service.test_connection()

            assert result["status"] == "error"
            assert "Tiempo de espera agotado" in result["error"]


@pytest.mark.asyncio
async def test_openrouter_request_error():
    """Prueba el manejo de errores generales de red con httpx."""
    with patch.object(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-key"):
        service = OpenRouterService()
        with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection refused")):
            result = await service.test_connection()

            assert result["status"] == "error"
            assert "Error de red" in result["error"]


def test_health_openrouter_endpoint_success(client: TestClient):
    """Prueba el endpoint GET /api/v1/health/openrouter cuando la respuesta es exitosa."""
    mock_success = {
        "status": "ok",
        "provider": "openrouter",
        "model": "openrouter/free",
        "message": "OpenRouter OK"
    }

    with patch.object(openrouter_service, "test_connection", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = mock_success
        response = client.get("/api/v1/health/openrouter")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["provider"] == "openrouter"
        assert data["model"] == "openrouter/free"
        assert data["message"] == "OpenRouter OK"


def test_health_openrouter_endpoint_error(client: TestClient):
    """Prueba el endpoint GET /api/v1/health/openrouter cuando hay un error de conexión."""
    mock_error = {
        "status": "error",
        "provider": "openrouter",
        "model": "openrouter/free",
        "error": "OPENROUTER_API_KEY no está configurada."
    }

    with patch.object(openrouter_service, "test_connection", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = mock_error
        response = client.get("/api/v1/health/openrouter")

        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "error"
        assert data["provider"] == "openrouter"
        assert "OPENROUTER_API_KEY no está configurada" in data["error"]
