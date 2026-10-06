#!/usr/bin/env python3
"""
Script de diagnóstico y prueba de conexión aislada con OpenRouter.
Ejecución:
    cd backend
    python scripts/test_openrouter.py
"""

import sys
import os
import asyncio
from pathlib import Path

# Añadir el directorio raíz del backend al sys.path para importar módulos de la app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.openrouter_service import openrouter_service


async def main():
    print("=" * 60)
    print(" TalentMatch — Prueba de Diagnóstico OpenRouter")
    print("=" * 60)

    # 1. Comprobar presencia de la variable de entorno
    is_set = openrouter_service.is_configured()
    estado_key = "configurada" if is_set else "NO configurada"

    print(f"OPENROUTER_API_KEY:  {estado_key}")
    print(f"OPENROUTER_MODEL:    {settings.OPENROUTER_MODEL}")
    print(f"OPENROUTER_BASE_URL: {settings.OPENROUTER_BASE_URL}")
    print("-" * 60)

    if not is_set:
        print("[AVISO] La variable OPENROUTER_API_KEY no está configurada o está vacía.")
        print("Para probar la conexión real:")
        print("1. Obtén tu API Key en https://openrouter.ai/keys")
        print("2. Agrégala a backend/.env -> OPENROUTER_API_KEY=tu_clave_aqui")
        print("3. Vuelve a ejecutar este script.")
        print("=" * 60)
        sys.exit(1)

    # 2. Realizar llamada real a OpenRouter
    print("Conectando con OpenRouter...")
    result = await openrouter_service.test_connection()

    print("-" * 60)
    if result.get("status") == "ok":
        print("Conexión:   OK")
        print(f"Proveedor:  {result.get('provider')}")
        print(f"Modelo:     {result.get('model')}")
        print("Respuesta recibida:")
        print(f"  {result.get('message')}")
        print("=" * 60)
        print("[OK] Prueba de integracion con OpenRouter COMPLETADA con exito.")
        sys.exit(0)
    else:
        print("Conexion:   ERROR")
        print(f"Proveedor:  {result.get('provider')}")
        print(f"Modelo:     {result.get('model')}")
        print("Detalle del error:")
        print(f"  {result.get('error')}")
        print("=" * 60)
        print("[ERROR] No se pudo completar la prueba con OpenRouter.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
