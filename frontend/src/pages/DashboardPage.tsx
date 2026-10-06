import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { jobOfferService } from '../services/jobOfferService';
import { DashboardStats as DashboardStatsType } from '../types/dashboard';
import { JobOffer } from '../types/jobOffer';
import { DashboardStats } from '../components/DashboardStats';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, offersData] = await Promise.all([
        dashboardService.getDashboardStats(),
        jobOfferService.getJobOffers(),
      ]);
      setStats(statsData);
      setOffers(offersData);
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar la información del dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filtrar ofertas en cliente
  const filteredOffers = offers.filter((offer) => {
    if (filterStatus !== 'all' && offer.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      offer.title.toLowerCase().includes(q) ||
      offer.location?.toLowerCase().includes(q) ||
      offer.required_skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full text-left space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#F7F6F3] border border-[#EAEAEA] text-[11px] font-mono text-[#555555] mb-2">
            <span>PASO 5 · Panel Principal</span>
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-[#111111]">
            Dashboard de Reclutamiento
          </h1>
          <p className="mt-1 text-sm text-[#555555]">
            Monitorea los procesos de selección, el flujo de CVs cargados y el estado de evaluaciones con Inteligencia Artificial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/job-offers/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-medium rounded-md shadow-sm transition-all"
          >
            <span className="text-base leading-none">+</span>
            <span>Nueva Oferta</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="editorial-card p-6 text-center space-y-3 border-red-200 bg-red-50/20 rounded-xl">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-1.5 text-xs font-medium text-[#111111] bg-white border border-[#CCCCCC] rounded-md hover:bg-[#F9F9F9] transition-colors"
          >
            Reintentar carga de datos
          </button>
        </div>
      )}

      {/* Metric Cards Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#787774]">
          Resumen General del Sistema
        </h2>
        <DashboardStats stats={stats} isLoading={isLoading} />
      </section>

      {/* Section: Convocatorias y Procesos */}
      <section className="space-y-4 pt-4 border-t border-[#EAEAEA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif font-semibold text-[#111111]">
              Ofertas Laborales Activas
            </h2>
            <p className="text-xs text-[#787774] mt-0.5">
              Selecciona una convocatoria para gestionar sus candidatos, evaluar CVs y ver puntajes.
            </p>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-0.5 bg-[#F4F4F2] rounded-lg border border-[#EAEAEA] text-xs font-medium">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                Todas ({offers.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterStatus === 'active'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                Inactivas
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Buscar oferta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all placeholder:text-[#AAAAAA]"
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888888]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="editorial-card p-6 bg-white border border-[#EAEAEA] rounded-xl animate-pulse space-y-4">
                <div className="h-4 bg-[#EEEEEE] rounded w-3/4" />
                <div className="h-3 bg-[#F4F4F4] rounded w-1/2" />
                <div className="h-10 bg-[#F7F6F3] rounded" />
              </div>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          /* Empty state */
          <div className="editorial-card p-12 text-center space-y-4 bg-white border border-[#EAEAEA] rounded-xl">
            <div className="w-12 h-12 rounded-full bg-[#F4F4F2] flex items-center justify-center mx-auto text-[#666666]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-[#111111]">
                {searchQuery
                  ? 'No se encontraron convocatorias con ese criterio'
                  : 'Comienza creando tu primera oferta laboral'}
              </h3>
              <p className="text-xs text-[#787774] mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Prueba modificando los términos de búsqueda o el filtro de estado.'
                  : 'Registra el perfil del puesto y sus competencias requeridas para iniciar la recepción y análisis de currículums.'}
              </p>
            </div>
            {!searchQuery && (
              <Link
                to="/job-offers/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white text-xs font-medium rounded-md transition-all shadow-sm"
              >
                <span>+ Crear primera oferta</span>
              </Link>
            )}
          </div>
        ) : (
          /* Job Offers Grid Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => {
              const totalCvs = offer.cvs_count ?? 0;
              const evaluatedCvs = offer.evaluated_count ?? 0;
              const pendingCvs = Math.max(0, totalCvs - evaluatedCvs);

              return (
                <div
                  key={offer.id}
                  className="editorial-card p-6 bg-white border border-[#EAEAEA] rounded-xl flex flex-col justify-between gap-5 hover:border-[#CCCCCC] transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                            offer.status === 'active'
                              ? 'bg-[#EBF5EC] text-[#28572E] border border-[#D5EBD7]'
                              : 'bg-[#F2F2F2] text-[#666666] border border-[#E0E0E0]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              offer.status === 'active' ? 'bg-[#28572E]' : 'bg-[#999999]'
                            }`}
                          />
                          {offer.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                        <h3 className="text-lg font-serif font-bold text-[#111111] group-hover:text-black line-clamp-1">
                          {offer.title}
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#888888] font-mono shrink-0">
                        {new Date(offer.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>

                    {/* Location and Employment Type */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                      {offer.location && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F8] border border-[#EAEAEA] rounded text-[11px] font-mono">
                          📍 {offer.location}
                        </span>
                      )}
                      {offer.employment_type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F8] border border-[#EAEAEA] rounded text-[11px] font-mono">
                          ⏱️ {offer.employment_type}
                        </span>
                      )}
                    </div>

                    {/* Brief description excerpt */}
                    <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                      {offer.description}
                    </p>
                  </div>

                  {/* Metrics Bar & Action */}
                  <div className="space-y-3 pt-3 border-t border-[#F0F0EE]">
                    {/* CVs and Evaluation summary */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#FBFBFA] border border-[#EAEAEA] p-2.5 rounded-lg">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-[#787774]">
                          Total CVs
                        </div>
                        <div className="text-sm font-serif font-bold text-[#111111]">
                          {totalCvs}
                        </div>
                      </div>
                      <div className="border-x border-[#EAEAEA]">
                        <div className="text-[10px] uppercase font-mono text-[#28572E]">
                          Evaluados
                        </div>
                        <div className="text-sm font-serif font-bold text-[#28572E]">
                          {evaluatedCvs}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-[#B45309]">
                          Pendientes
                        </div>
                        <div className="text-sm font-serif font-bold text-[#B45309]">
                          {pendingCvs}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-mono text-[#888888]">
                        ID #{offer.id}
                      </span>
                      <button
                        onClick={() => navigate(`/job-offers/${offer.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111111] hover:bg-[#333333] text-white text-xs font-medium rounded-md transition-colors shadow-xs"
                      >
                        <span>Ver candidatos</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Methodological / Ethical Disclaimer */}
      <div className="p-4 rounded-xl bg-[#F7F6F3] border border-[#EAEAEA] text-xs text-[#666666] flex items-start sm:items-center gap-3">
        <svg className="w-5 h-5 text-[#888888] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="leading-relaxed">
          <strong>Aviso de uso ético:</strong> Las evaluaciones generadas por IA son una herramienta técnica de apoyo para la preselección objetiva basada en competencias. La decisión final de selección corresponde al criterio del reclutador humano.
        </span>
      </div>
    </div>
  );
};
