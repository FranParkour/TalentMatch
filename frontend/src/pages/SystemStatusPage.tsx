import { useState, useEffect, useCallback } from 'react';
import { StatusCard } from '../components/StatusCard';
import { ArchitectureFlow } from '../components/ArchitectureFlow';
import { SystemInfo } from '../components/SystemInfo';
import { apiService } from '../services/api';
import { ApiHealthResponse, DatabaseHealthResponse, ServiceStatusState } from '../types/api';

export const SystemStatusPage: React.FC = () => {
  const [apiState, setApiState] = useState<ServiceStatusState<ApiHealthResponse>>({
    status: 'loading',
    data: null,
    latencyMs: null,
    lastChecked: null,
    errorMessage: null,
  });

  const [dbState, setDbState] = useState<ServiceStatusState<DatabaseHealthResponse>>({
    status: 'loading',
    data: null,
    latencyMs: null,
    lastChecked: null,
    errorMessage: null,
  });

  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const checkApi = useCallback(async () => {
    setApiState((prev) => ({ ...prev, status: 'loading', errorMessage: null }));
    try {
      const { data, latencyMs } = await apiService.getApiHealth();
      setApiState({
        status: 'connected',
        data,
        latencyMs,
        lastChecked: new Date(),
        errorMessage: null,
      });
    } catch (err: any) {
      setApiState({
        status: 'error',
        data: null,
        latencyMs: null,
        lastChecked: new Date(),
        errorMessage: err.message || 'No se pudo conectar con la API de FastAPI',
      });
    }
  }, []);

  const checkDatabase = useCallback(async () => {
    setDbState((prev) => ({ ...prev, status: 'loading', errorMessage: null }));
    try {
      const { data, latencyMs } = await apiService.getDatabaseHealth();
      setDbState({
        status: 'connected',
        data,
        latencyMs,
        lastChecked: new Date(),
        errorMessage: null,
      });
    } catch (err: any) {
      setDbState({
        status: 'error',
        data: null,
        latencyMs: null,
        lastChecked: new Date(),
        errorMessage: err.message || 'Error de conexión con PostgreSQL',
      });
    }
  }, []);

  const checkAll = useCallback(async () => {
    setIsRefreshingAll(true);
    await Promise.all([checkApi(), checkDatabase()]);
    setIsRefreshingAll(false);
  }, [checkApi, checkDatabase]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  const allConnected = apiState.status === 'connected' && dbState.status === 'connected';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-grow text-left">
      {/* Hero Section */}
      <section className="mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F7F6F3] border border-[#EAEAEA] text-xs font-mono text-[#555555] mb-4">
          <span className="w-2 h-2 rounded-full bg-[#111111]" />
          <span>Infraestructura & Estado de Servicios</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-[#111111] leading-[1.15]">
          Monitoreo de Infraestructura
        </h1>

        <p className="mt-3 text-base text-[#555555] max-w-2xl font-light leading-relaxed">
          Supervisión en tiempo real de la conectividad entre el cliente React, la API REST en FastAPI y PostgreSQL 16.
        </p>

        {/* Global Pipeline Health Banner */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#EAEAEA] text-xs">
            <span className="text-[#787774] font-mono">Estado General:</span>
            {allConnected ? (
              <span className="font-medium text-[#346538] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#346538]" />
                Todos los servicios operativos
              </span>
            ) : apiState.status === 'loading' || dbState.status === 'loading' ? (
              <span className="font-medium text-[#956400] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#956400] animate-pulse" />
                Verificando comunicación...
              </span>
            ) : (
              <span className="font-medium text-[#9F2F2D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9F2F2D]" />
                Servicios con incidencias
              </span>
            )}
          </div>

          <button
            onClick={checkAll}
            disabled={isRefreshingAll}
            className="px-4 py-1.5 rounded-lg bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Verificar Conexión
          </button>
        </div>
      </section>

      {/* Live Status Cards (Bento Grid) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatusCard
          title="Backend API (FastAPI)"
          subtitle="Servicio REST modular y enrutador principal"
          endpoint="/api/v1/health"
          status={apiState.status}
          latencyMs={apiState.latencyMs}
          lastChecked={apiState.lastChecked}
          data={apiState.data}
          errorMessage={apiState.errorMessage}
          onRefresh={checkApi}
        />

        <StatusCard
          title="Base de Datos (PostgreSQL)"
          subtitle="Persistencia relacional y conectividad SQLAlchemy"
          endpoint="/api/v1/health/database"
          status={dbState.status}
          latencyMs={dbState.latencyMs}
          lastChecked={dbState.lastChecked}
          data={dbState.data}
          errorMessage={dbState.errorMessage}
          onRefresh={checkDatabase}
        />
      </section>

      {/* Architecture Topology */}
      <section className="mb-8">
        <ArchitectureFlow
          apiStatus={apiState.status}
          dbStatus={dbState.status}
        />
      </section>

      {/* Roadmap and Info */}
      <section className="mb-8">
        <SystemInfo />
      </section>
    </div>
  );
};
