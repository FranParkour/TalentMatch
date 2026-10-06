import React, { useState, useEffect } from 'react';
import { candidateCvService } from '../services/candidateCvService';
import { CandidateCVDetail } from '../types/candidateCv';

interface CVTextPreviewModalProps {
  isOpen: boolean;
  jobOfferId: number;
  cvId: number | null;
  onClose: () => void;
}

export const CVTextPreviewModal: React.FC<CVTextPreviewModalProps> = ({
  isOpen,
  jobOfferId,
  cvId,
  onClose,
}) => {
  const [detail, setDetail] = useState<CandidateCVDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !cvId) {
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await candidateCvService.getCVDetail(jobOfferId, cvId);
        setDetail(data);
      } catch (err: any) {
        setError(err.message || 'No fue posible cargar el detalle del CV.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, jobOfferId, cvId]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!detail?.extracted_text) return;
    navigator.clipboard.writeText(detail.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileUrl = cvId ? candidateCvService.getCVFileUrl(jobOfferId, cvId) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#EAEAEA] rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 border-b border-[#EAEAEA] flex items-start justify-between gap-4 bg-[#FAFAFA]">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-mono text-[#787774] block uppercase tracking-wider">
              Detalle y Extracción de Texto
            </span>
            <h3 className="text-lg font-serif font-semibold text-[#111111] truncate mt-0.5">
              {detail?.original_filename || 'Cargando documento...'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-md hover:bg-[#EEEEEE] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#787774] font-mono">Leyendo contenido textual...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#FDEBEC] border border-[#F9D2D4] rounded-lg text-xs text-[#9F2F2D]">
              {error}
            </div>
          )}

          {!isLoading && detail && (
            <>
              {/* Metadata chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F7F6F3] p-3 rounded-lg border border-[#EAEAEA] font-mono">
                <div>
                  <span className="text-[#888888] block text-[10px]">ESTADO</span>
                  <span
                    className={`font-semibold ${
                      detail.processing_status === 'processed'
                        ? 'text-[#28572E]'
                        : 'text-[#9F2F2D]'
                    }`}
                  >
                    {detail.processing_status === 'processed' ? '✓ Procesado' : '✕ Con Errores'}
                  </span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">TAMAÑO</span>
                  <span className="text-[#111111] font-semibold">{detail.file_size_formatted}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">PALABRAS</span>
                  <span className="text-[#111111] font-semibold">{detail.word_count}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">CARACTERES</span>
                  <span className="text-[#111111] font-semibold">{detail.text_length}</span>
                </div>
              </div>

              {/* Extraction error warning if any */}
              {detail.error_message && (
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#B45309]">
                  <p className="font-semibold font-mono text-[11px] mb-0.5">Aviso de Procesamiento:</p>
                  <p>{detail.error_message}</p>
                </div>
              )}

              {/* Extracted Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[#111111] font-mono uppercase tracking-wider text-[11px]">
                    Texto Extraído del PDF (Normalizado)
                  </label>
                  {detail.extracted_text && (
                    <button
                      onClick={handleCopyText}
                      className="text-[11px] font-mono text-[#555555] hover:text-[#111111] inline-flex items-center gap-1 hover:underline"
                    >
                      {copied ? '✓ Copiado' : 'Copiar texto'}
                    </button>
                  )}
                </div>

                {detail.extracted_text ? (
                  <div className="p-4 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg max-h-72 overflow-y-auto text-xs text-[#222222] font-mono whitespace-pre-wrap leading-relaxed">
                    {detail.extracted_text}
                  </div>
                ) : (
                  <div className="p-6 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg text-center text-xs text-[#787774] italic">
                    No se encontró texto digital en el documento.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between gap-3">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-medium text-[#111111] bg-white hover:bg-[#F7F6F3] border border-[#D1D1CF] rounded-md transition-all inline-flex items-center gap-1.5 shadow-subtle"
          >
            <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Abrir PDF original
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#111111] hover:bg-[#333333] rounded-md transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
