import { ApiHealthResponse, DatabaseHealthResponse, RootApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Fetches root API information
   */
  async getRootInfo(): Promise<{ data: RootApiResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Error en API raíz (${response.status}: ${response.statusText})`);
    }

    const data: RootApiResponse = await response.json();
    return { data, latencyMs };
  }

  /**
   * Checks API service health endpoint: GET /api/v1/health
   */
  async getApiHealth(): Promise<{ data: ApiHealthResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await fetch(`${this.baseUrl}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Servicio FastAPI no disponible (${response.status}: ${response.statusText})`);
    }

    const data: ApiHealthResponse = await response.json();
    return { data, latencyMs };
  }

  /**
   * Checks Database connectivity endpoint: GET /api/v1/health/database
   */
  async getDatabaseHealth(): Promise<{ data: DatabaseHealthResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await fetch(`${this.baseUrl}/api/v1/health/database`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorDetail = errorJson.error;
      } catch {
        // Fallback to status text
      }
      throw new Error(`PostgreSQL desconectado o error de consulta: ${errorDetail}`);
    }

    const data: DatabaseHealthResponse = await response.json();
    return { data, latencyMs };
  }
}

export const apiService = new ApiService(API_BASE_URL);
