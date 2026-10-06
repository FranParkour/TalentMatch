# TalentMatch Backend (FastAPI + SQLAlchemy)

Backend modular para el sistema de clasificación y preselección de candidatos **TalentMatch**.

## Requisitos Previos

- Python 3.10+ (Recomendado 3.12)
- Docker & Docker Compose (para la base de datos PostgreSQL)

## Instalación y Configuración

1. **Crear entorno virtual**:
   ```bash
   python -m venv .venv
   ```

2. **Activar el entorno virtual**:
   - En Windows (PowerShell):
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - En Linux / macOS:
     ```bash
     source .venv/bin/activate
     ```

3. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Variables de entorno**:
   Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

5. **Iniciar la base de datos** (desde la raíz del proyecto):
   ```bash
   docker compose up -d
   ```

6. **Ejecutar el servidor de desarrollo**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Endpoints Principales

- `GET /` : Información básica de la API y enlaces.
- `GET /api/v1/health` : Estado operativo del backend.
- `GET /api/v1/health/database` : Verificación de conexión real a PostgreSQL.
- `GET /docs` : Documentación interactiva Swagger UI.
- `GET /redoc` : Documentación ReDoc.
