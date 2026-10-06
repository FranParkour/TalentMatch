import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobOfferFormData, JobOfferStatus } from '../types/jobOffer';
import { ChipInput } from './ChipInput';

interface JobOfferFormProps {
  initialData?: Partial<JobOfferFormData>;
  onSubmit: (data: JobOfferFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  cancelHref?: string;
}

export const JobOfferForm = ({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar Oferta',
  cancelHref = '/job-offers',
}: JobOfferFormProps) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<JobOfferFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    employment_type: initialData?.employment_type || 'Full-time',
    experience_required: initialData?.experience_required || 'Junior (1-2 años)',
    status: (initialData?.status as JobOfferStatus) || 'active',
    required_skills: initialData?.required_skills || [],
    preferred_skills: initialData?.preferred_skills || [],
    requirements: initialData?.requirements || [],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título del cargo es obligatorio';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción de la oferta es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-left">
      {/* Sección 1: Información General */}
      <div className="editorial-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#EAEAEA] pb-4">
          <h2 className="text-lg font-serif font-medium text-[#111111]">
            1. Información General del Cargo
          </h2>
          <p className="text-xs text-[#787774] mt-1">
            Datos principales que identificarán la vacante en el listado y para los postulantes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title (Full width) */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Título del Cargo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Desarrollador Backend Python Senior"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all placeholder:text-[#AAAAAA] ${
                errors.title ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#111111]'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Remoto, Santiago de Chile, Híbrido"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all placeholder:text-[#AAAAAA]"
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Tipo de Jornada
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all"
            >
              <option value="Full-time">Full-time (Jornada Completa)</option>
              <option value="Part-time">Part-time (Media Jornada)</option>
              <option value="Freelance / Honorarios">Freelance / Honorarios</option>
              <option value="Por Proyecto">Por Proyecto</option>
              <option value="Práctica Profesional">Práctica Profesional</option>
            </select>
          </div>

          {/* Experience Required */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Nivel de Experiencia
            </label>
            <select
              value={formData.experience_required}
              onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all"
            >
              <option value="Sin experiencia previa">Sin experiencia previa</option>
              <option value="Junior (1-2 años)">Junior (1-2 años)</option>
              <option value="Semi-Senior (2-4 años)">Semi-Senior (2-4 años)</option>
              <option value="Senior (4+ años)">Senior (4+ años)</option>
              <option value="Lead / Experto (6+ años)">Lead / Experto (6+ años)</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Estado de la Oferta
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as JobOfferStatus })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all"
            >
              <option value="active">Activa (Recepción abierta)</option>
              <option value="inactive">Inactiva (Cerrada / Pausada)</option>
            </select>
          </div>

          {/* Description (Full width) */}
          <div className="md:col-span-2 space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
              Descripción del Cargo <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalla las responsabilidades, el contexto del equipo, desafíos del cargo y beneficios..."
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all placeholder:text-[#AAAAAA] leading-relaxed ${
                errors.description ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#111111]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección 2: Criterios de Selección y Habilidades */}
      <div className="editorial-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#EAEAEA] pb-4">
          <h2 className="text-lg font-serif font-medium text-[#111111]">
            2. Criterios de Selección para IA
          </h2>
          <p className="text-xs text-[#787774] mt-1">
            Estos criterios serán utilizados por el motor de evaluación para calcular el puntaje de compatibilidad de los currículums.
          </p>
        </div>

        <div className="space-y-6">
          {/* Required Skills */}
          <ChipInput
            label="Habilidades Técnicas Obligatorias (Must Have)"
            description="Competencias indispensables requeridas para desempeñar el puesto."
            placeholder="Ej: Python, FastAPI, PostgreSQL, Git..."
            items={formData.required_skills}
            onChange={(items) => setFormData({ ...formData, required_skills: items })}
            badgeColor="blue"
          />

          {/* Preferred Skills */}
          <ChipInput
            label="Habilidades Deseadas / Plus (Nice to Have)"
            description="Herramientas o conocimientos complementarios que otorgan puntaje extra."
            placeholder="Ej: Docker, AWS, Redis, GraphQL, CI/CD..."
            items={formData.preferred_skills}
            onChange={(items) => setFormData({ ...formData, preferred_skills: items })}
            badgeColor="purple"
          />

          {/* Requirements */}
          <ChipInput
            label="Requisitos Adicionales / Académicos"
            description="Títulos universitarios, certificaciones, nivel de inglés o años mínimos de experiencia en rubro específico."
            placeholder="Ej: Título en Ingeniería en Informática, Inglés técnico intermedio B2..."
            items={formData.requirements}
            onChange={(items) => setFormData({ ...formData, requirements: items })}
            badgeColor="gray"
          />
        </div>
      </div>

      {/* Actions toolbar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(cancelHref)}
          disabled={isLoading}
          className="px-5 py-2.5 text-xs font-medium text-[#555555] bg-[#F7F6F3] border border-[#EAEAEA] rounded-md hover:bg-[#EAEAE6] transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 text-xs font-medium text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
