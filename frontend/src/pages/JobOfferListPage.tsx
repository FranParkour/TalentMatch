import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobOfferService } from '../services/jobOfferService';
import { JobOffer } from '../types/jobOffer';
import { ConfirmModal } from '../components/ConfirmModal';
import { Toast, ToastType } from '../components/Toast';

export const JobOfferListPage: React.FC = () => {
  const navigate = useNavigate();

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete modal state
  const [offerToDelete, setOfferToDelete] = useState<JobOffer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = filterStatus === 'all' ? undefined : filterStatus;
      const data = await jobOfferService.getJobOffers(statusParam);
      setOffers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las ofertas laborales.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      await jobOfferService.deleteJobOffer(offerToDelete.id);
      setToast({
        message: `La oferta "${offerToDelete.title}" fue eliminada correctamente.`,
        type: 'success',
      });
      setOfferToDelete(null);
      await fetchOffers();
    } catch (err: any) {
      setToast({
        message: err.message || 'No se pudo eliminar la oferta laboral.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
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
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#F7F6F3] border border-[#EAEAEA] text-[11px] font-mono text-[#555555] mb-2">
            <span>PASO 2 · Procesos de Selección</span>
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-[#111111]">
            Ofertas Laborales
          </h1>
          <p className="mt-1 text-sm text-[#555555]">
            Administra las convocatorias y criterios de selección que serán evaluados con IA.
          </p>
        </div>

        <div>
          <Link
            to="/job-offers/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-medium rounded-md shadow-sm transition-all"
          >
            <span className="text-base leading-none">+</span>
            <span>Nueva Oferta</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="inline-flex p-1 bg-[#F4F4F2] rounded-lg border border-[#EAEAEA] text-xs font-medium self-start">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Todas ({offers.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterStatus === 'active'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterStatus === 'inactive'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Inactivas
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por cargo, skill o ciudad..."
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

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="editorial-card p-6 animate-pulse space-y-3">
              <div className="h-4 bg-[#EEEEEE] rounded w-1/3" />
              <div className="h-3 bg-[#F4F4F4] rounded w-1/2" />
              <div className="h-3 bg-[#F4F4F4] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="editorial-card p-8 text-center space-y-3 border-red-200 bg-red-50/20">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={fetchOffers}
            className="px-4 py-1.5 text-xs font-medium text-[#111111] bg-white border border-[#CCCCCC] rounded-md hover:bg-[#F9F9F9]"
          >
            Reintentar conexión
          </button>
        </div>
      ) : filteredOffers.length === 0 ? (
        /* Empty state */
        <div className="editorial-card p-12 text-center space-y-4 bg-white">
          <div className="w-12 h-12 rounded-full bg-[#F4F4F2] flex items-center justify-center mx-auto text-[#666666]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-serif font-medium text-[#111111]">
              No existen procesos de selección registrados
            </h3>
            <p className="text-xs text-[#787774] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No se encontraron ofertas que coincidan con la búsqueda.'
                : 'Comienza creando la primera oferta laboral para configurar los criterios de evaluación de CVs.'}
            </p>
          </div>
          {!searchQuery && (
            <Link
              to="/job-offers/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white text-xs font-medium rounded-md transition-all"
            >
              <span>+ Crear primera oferta</span>
            </Link>
          )}
        </div>
      ) : (
        /* Offers List Cards */
        <div className="grid grid-cols-1 gap-4">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="editorial-card p-6 hover:border-[#CCCCCC] transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                {/* Top badges and title */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono mb-1.5 ${
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

                    <h3 className="text-lg font-serif font-semibold text-[#111111] group-hover:text-black">
                      <Link to={`/job-offers/${offer.id}`} className="hover:underline">
                        {offer.title}
                      </Link>
                    </h3>
                  </div>

                  <span className="text-[11px] text-[#888888] font-mono">
                    Publicada: {new Date(offer.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                  {offer.location && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F8] border border-[#EAEAEA] rounded text-[11px]">
                      📍 {offer.location}
                    </span>
                  )}
                  {offer.employment_type && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F8] border border-[#EAEAEA] rounded text-[11px]">
                      ⏱️ {offer.employment_type}
                    </span>
                  )}
                  {offer.experience_required && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F8] border border-[#EAEAEA] rounded text-[11px]">
                      🎓 {offer.experience_required}
                    </span>
                  )}
                </div>

                {/* Description Excerpt */}
                <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                  {offer.description}
                </p>

                {/* Skills tags preview */}
                {offer.required_skills && offer.required_skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#888888] font-mono mr-1">
                      Skills:
                    </span>
                    {offer.required_skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE] rounded text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {offer.required_skills.length > 4 && (
                      <span className="text-[10px] text-[#777777] font-mono self-center">
                        +{offer.required_skills.length - 4} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F0F0EE]">
                <span className="text-[11px] font-mono text-[#888888]">
                  ID Proceso #{offer.id}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/job-offers/${offer.id}`)}
                    className="px-3 py-1 text-xs font-medium text-[#111111] bg-[#F7F6F3] hover:bg-[#EAEAE6] border border-[#EAEAEA] rounded transition-all"
                  >
                    Ver Detalle
                  </button>
                  <button
                    onClick={() => navigate(`/job-offers/${offer.id}/edit`)}
                    className="px-3 py-1 text-xs font-medium text-[#555555] hover:text-[#111111] hover:bg-[#F7F6F3] rounded transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setOfferToDelete(offer)}
                    className="px-2.5 py-1 text-xs font-medium text-[#9F2F2D] hover:bg-red-50 rounded transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={Boolean(offerToDelete)}
        title="¿Eliminar oferta laboral?"
        message={`¿Estás seguro de que deseas eliminar permanentemente la oferta "${offerToDelete?.title}"? Esta acción eliminará los criterios de selección configurados.`}
        confirmText="Sí, eliminar oferta"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOfferToDelete(null)}
      />
    </div>
  );
};
