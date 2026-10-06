import {
  CandidateCV,
  CandidateCVDetail,
  CandidateCVDeleteResponse,
} from '../types/candidateCv';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

class CandidateCvService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Retrieves all CVs associated with a job offer.
   */
  async getCVsByJobOffer(jobOfferId: number | string): Promise<CandidateCV[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Uploads and extracts text from a PDF CV file.
   */
  async uploadCV(jobOfferId: number | string, file: File): Promise<CandidateCV> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = `Error al cargar el archivo (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          if (Array.isArray(errorJson.detail)) {
            errorDetail = errorJson.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          } else {
            errorDetail = errorJson.detail;
          }
        }
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Retrieves full details including extracted text of a CV.
   */
  async getCVDetail(jobOfferId: number | string, cvId: number | string): Promise<CandidateCVDetail> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/${cvId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Deletes a CV and its physical file.
   */
  async deleteCV(jobOfferId: number | string, cvId: number | string): Promise<CandidateCVDeleteResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/${cvId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = `Error al eliminar el CV (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch {
        // Fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Returns direct URL for downloading / viewing the stored PDF file.
   */
  getCVFileUrl(jobOfferId: number | string, cvId: number | string): string {
    return `${this.baseUrl}/api/v1/job-offers/${jobOfferId}/cvs/${cvId}/file`;
  }
}

export const candidateCvService = new CandidateCvService(API_BASE_URL);
