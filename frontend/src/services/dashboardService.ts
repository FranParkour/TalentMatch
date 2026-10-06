import { DashboardStats } from '../types/dashboard';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

class DashboardService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtiene las métricas consolidadas del sistema de reclutamiento:
   * ofertas activas, total de CVs, CVs evaluados y evaluaciones pendientes.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/api/v1/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = `Error al obtener estadísticas del dashboard (${response.status})`;
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

export const dashboardService = new DashboardService(API_BASE_URL);
