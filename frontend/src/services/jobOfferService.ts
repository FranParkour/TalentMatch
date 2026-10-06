import { JobOffer, JobOfferFormData, ApiDeleteResponse } from '../types/jobOffer';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

class JobOfferService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all job offers, optionally filtered by status
   */
  async getJobOffers(status?: string): Promise<JobOffer[]> {
    const url = new URL(`${this.baseUrl}/api/v1/job-offers/`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
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
        // Fallback to errorDetail
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  /**
   * Fetch a single job offer by ID
   */
  async getJobOfferById(id: number | string): Promise<JobOffer> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${id}`, {
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
   * Create a new job offer
   */
  async createJobOffer(data: JobOfferFormData): Promise<JobOffer> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorDetail = `Error al crear la oferta (${response.status})`;
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
   * Update an existing job offer
   */
  async updateJobOffer(id: number | string, data: Partial<JobOfferFormData>): Promise<JobOffer> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorDetail = `Error al actualizar la oferta (${response.status})`;
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
   * Delete a job offer
   */
  async deleteJobOffer(id: number | string): Promise<ApiDeleteResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-offers/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = `Error al eliminar la oferta (${response.status})`;
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
}

export const jobOfferService = new JobOfferService(API_BASE_URL);
