import React from 'react';
import { HealthStatusType } from '../types/api';

interface ArchitectureFlowProps {
  apiStatus: HealthStatusType;
  dbStatus: HealthStatusType;
}

export const ArchitectureFlow: React.FC<ArchitectureFlowProps> = ({ apiStatus, dbStatus }) => {
  return (
    <div className="editorial-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">Flujo de Arquitectura</h3>
          <p className="text-xs text-[#787774] mt-0.5">Topología de comunicación de tres capas para el MVP</p>
        </div>
        <span className="text-[11px] font-mono text-[#787774] uppercase px-2 py-0.5 rounded bg-[#F7F6F3] border border-[#EAEAEA]">
          Paso 1 / Base
        </span>
      </div>

      {/* Nodes visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative mt-6">
        {/* Layer 1: Frontend */}
        <div className="p-4 rounded-lg bg-[#FBFBFA] border border-[#EAEAEA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">Capa Cliente</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#346538]" />
            </div>
            <h4 className="font-semibold text-sm text-[#111111]">Frontend SPA</h4>
            <p className="text-xs text-[#787774] mt-1">React 18 + Vite + TypeScript + Tailwind CSS</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAEAEA] text-[11px] font-mono text-[#555555]">
            Puerto :5173
          </div>
        </div>

        {/* Layer 2: API Backend */}
        <div className="p-4 rounded-lg bg-[#FBFBFA] border border-[#EAEAEA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">Capa de Servicios</span>
              <span className={`inline-block w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-[#346538]' : apiStatus === 'loading' ? 'bg-[#956400]' : 'bg-[#9F2F2D]'
              }`} />
            </div>
            <h4 className="font-semibold text-sm text-[#111111]">FastAPI Backend</h4>
            <p className="text-xs text-[#787774] mt-1">API REST Modular, SQLAlchemy 2.0 & Pydantic</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAEAEA] text-[11px] font-mono text-[#555555]">
            Puerto :8000
          </div>
        </div>

        {/* Layer 3: Database */}
        <div className="p-4 rounded-lg bg-[#FBFBFA] border border-[#EAEAEA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">Capa de Datos</span>
              <span className={`inline-block w-2 h-2 rounded-full ${
                dbStatus === 'connected' ? 'bg-[#346538]' : dbStatus === 'loading' ? 'bg-[#956400]' : 'bg-[#9F2F2D]'
              }`} />
            </div>
            <h4 className="font-semibold text-sm text-[#111111]">PostgreSQL 16</h4>
            <p className="text-xs text-[#787774] mt-1">Contenedor Docker con Volumen Persistente</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAEAEA] text-[11px] font-mono text-[#555555]">
            Puerto :5432
          </div>
        </div>
      </div>
    </div>
  );
};
