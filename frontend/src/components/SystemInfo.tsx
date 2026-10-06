import React from 'react';

export const SystemInfo: React.FC = () => {
  return (
    <div className="editorial-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111111] tracking-tight">Estado del Proyecto & Hoja de Ruta</h3>
        <p className="text-xs text-[#787774] mt-0.5">Arquitectura técnica para Proyecto de Título de Ingeniería en Informática</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 text-xs">
        {/* Step 1 Accomplished */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#EDF3EC] text-[#346538] flex items-center justify-center font-mono font-semibold text-[10px] border border-[#D6E5D4]">
              ✓
            </span>
            <span className="font-semibold text-[#111111]">Paso 1: Infraestructura y Base (Completado)</span>
          </div>
          <ul className="space-y-2 text-[#555555] pl-7 list-disc marker:text-[#D1D1CF]">
            <li>Base de datos PostgreSQL 16 ejecutándose en Docker con persistencia.</li>
            <li>API REST con FastAPI, SQLAlchemy 2.0 y Pydantic Settings.</li>
            <li>Verificación de conectividad real mediante endpoints de salud.</li>
            <li>Frontend React + TypeScript + Vite con diseño editorial minimalista.</li>
            <li>CORS configurado y variables de entorno centralizadas.</li>
          </ul>
        </div>

        {/* Next Steps (Prepared Structure) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F7F6F3] text-[#787774] flex items-center justify-center font-mono font-semibold text-[10px] border border-[#EAEAEA]">
              2
            </span>
            <span className="font-semibold text-[#111111]">Siguientes Etapas (Estructura Preparada)</span>
          </div>
          <ul className="space-y-2 text-[#787774] pl-7 list-disc marker:text-[#EAEAEA]">
            <li>Modelos de datos para Ofertas Laborales, Candidatos y CVs.</li>
            <li>Pipeline de carga y extracción de texto de documentos PDF.</li>
            <li>Integración con Modelos de Lenguaje / Embeddings para evaluación.</li>
            <li>Cálculo de puntaje de afinidad y ranking de candidatos.</li>
            <li>Panel de control interactivo para reclutadores.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
