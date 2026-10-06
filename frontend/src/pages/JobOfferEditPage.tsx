import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobOfferService } from '../services/jobOfferService';
import { JobOffer, JobOfferFormData } from '../types/jobOffer';
import { JobOfferForm } from '../components/JobOfferForm';
import { Toast, ToastType } from '../components/Toast';

export const JobOfferEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<JobOffer | null>(null);
  const [isLoadingFetch, setIsLoadingFetch] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;
      setIsLoadingFetch(true);
      setError(null);
      try {
        const data = await jobOfferService.getJobOfferById(id);
        setInitialData(data);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la oferta para editar.');
      } finally {
        setIsLoadingFetch(false);
      }
    };
    fetchOffer();
  }, [id]);

  const handleUpdate = async (formData: JobOfferFormData) => {
    if (!id) return;
    setIsUpdating(true);
    setError(null);
    try {
      await jobOfferService.updateJobOffer(id, formData);
      setToast({
        message: '¡Oferta laboral actualizada exitosamente!',
        type: 'success',
      });
      setTimeout(() => {
        navigate(`/job-offers/${id}`);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la oferta laboral.');
      setToast({
        message: err.message || 'Error al actualizar la oferta.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingFetch) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 w-full text-left space-y-6">
        <div className="h-6 bg-[#EEEEEE] rounded w-1/4 animate-pulse" />
        <div className="h-10 bg-[#EEEEEE] rounded w-1/2 animate-pulse" />
        <div className="h-64 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 w-full text-left">
        <div className="editorial-card p-10 text-center space-y-4">
          <h2 className="text-xl font-serif font-semibold text-[#111111]">
            Error al cargar la oferta
          </h2>
          <p className="text-xs text-[#666666]">{error}</p>
          <Link
            to="/job-offers"
            className="inline-flex px-4 py-2 text-xs font-medium text-white bg-[#111111] rounded-md hover:bg-[#333333]"
          >
            ← Volver a Ofertas Laborales
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full text-left space-y-6">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          to={`/job-offers/${id}`}
          className="text-xs font-mono text-[#666666] hover:text-[#111111] transition-colors inline-flex items-center gap-1"
        >
          ← Volver al Detalle de la Oferta
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#EAEAEA] pb-4">
        <h1 className="text-3xl font-serif tracking-tight text-[#111111]">
          Editar Oferta Laboral
        </h1>
        <p className="mt-1 text-sm text-[#555555]">
          Modifica los requisitos, descripción o estado de la vacante.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Form preloaded */}
      {initialData && (
        <JobOfferForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          submitLabel="Guardar Cambios"
          cancelHref={`/job-offers/${id}`}
        />
      )}
    </div>
  );
};
