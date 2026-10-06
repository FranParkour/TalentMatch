export interface ApiHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

export interface DatabaseHealthResponse {
  status: string;
  database: string;
  timestamp: string;
  database_name?: string;
  error?: string;
}

export interface RootApiResponse {
  message: string;
  service: string;
  version: string;
  environment: string;
  docs: string;
  health_check: string;
  database_health_check: string;
}

export type HealthStatusType = 'loading' | 'connected' | 'error';

export interface ServiceStatusState<T> {
  status: HealthStatusType;
  data: T | null;
  latencyMs: number | null;
  lastChecked: Date | null;
  errorMessage: string | null;
}
