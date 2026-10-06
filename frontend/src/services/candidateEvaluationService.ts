import {
  CandidateEvaluation,
  CandidateEvaluationBatchItem,
} from '../types/candidateEvaluation';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

class CandidateEvaluationService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Ejecuta la evaluación de compatibilidad asistida por IA para un CV individual.
   */
  async evaluateCV(
    jobOfferId: number | string,
    cvId: number | string
  ): Promise<CandidateEvaluation> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/${cvId}/evaluate`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      let errorDetail = `Error al evaluar el CV (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Obtiene la evaluación guardada de un CV sin volver a llamar a la IA.
   */
  async getEvaluation(
    jobOfferId: number | string,
    cvId: number | string
  ): Promise<CandidateEvaluation> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/${cvId}/evaluation`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      let errorDetail = `Error al obtener la evaluación (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Ejecuta la evaluación secuencial de todos los CVs procesados pendientes en la oferta.
   */
  async evaluateAllCVs(
    jobOfferId: number | string
  ): Promise<CandidateEvaluationBatchItem[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/job-offers/${jobOfferId}/evaluate`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      let errorDetail = `Error al evaluar CVs en lote (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }
}

export const candidateEvaluationService = new CandidateEvaluationService(API_BASE_URL);
