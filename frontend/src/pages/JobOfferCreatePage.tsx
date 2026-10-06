import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobOfferService } from '../services/jobOfferService';
import { JobOfferFormData } from '../types/jobOffer';
import { JobOfferForm } from '../components/JobOfferForm';
import { Toast, ToastType } from '../components/Toast';

export const JobOfferCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleCreate = async (formData: JobOfferFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await jobOfferService.createJobOffer(formData);
      setToast({
        message: '¡Oferta laboral creada con éxito!',
        type: 'success',
      });
      // Redirect to detail page after slight delay or immediately
      setTimeout(() => {
        navigate(`/job-offers/${created.id}`);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la oferta laboral.');
      setToast({
        message: err.message || 'Error al guardar la oferta.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          to="/job-offers"
          className="text-xs font-mono text-[#666666] hover:text-[#111111] transition-colors inline-flex items-center gap-1"
        >
          ← Volver a Ofertas Laborales
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#EAEAEA] pb-4">
        <h1 className="text-3xl font-serif tracking-tight text-[#111111]">
          Nueva Oferta Laboral
        </h1>
        <p className="mt-1 text-sm text-[#555555]">
          Define las características del cargo y los criterios técnicos que estructurarán la evaluación de candidatos.
        </p>
      </div>

      {/* Top Error banner if any */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          <strong>Error al crear:</strong> {error}
        </div>
      )}

      {/* Reusable Form */}
      <JobOfferForm
        onSubmit={handleCreate}
        isLoading={isLoading}
        submitLabel="Publicar Oferta Laboral"
        cancelHref="/job-offers"
      />
    </div>
  );
};
