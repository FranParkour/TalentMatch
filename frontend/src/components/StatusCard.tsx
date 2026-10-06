import React from 'react';
import { StatusBadge } from './StatusBadge';
import { HealthStatusType } from '../types/api';

interface StatusCardProps {
  title: string;
  subtitle: string;
  endpoint: string;
  status: HealthStatusType;
  latencyMs: number | null;
  lastChecked: Date | null;
  data: Record<string, any> | null;
  errorMessage: string | null;
  onRefresh?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  subtitle,
  endpoint,
  status,
  latencyMs,
  lastChecked,
  data,
  errorMessage,
  onRefresh,
}) => {
  return (
    <div className="editorial-card p-6 flex flex-col justify-between h-full">
      {/* Top section: Title & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-[#111111] tracking-tight">{title}</h3>
            <p className="text-xs text-[#787774] mt-0.5">{subtitle}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Endpoint path badge */}
        <div className="mt-4 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F7F6F3] border border-[#EAEAEA] text-xs font-mono text-[#555555]">
            <span className="font-semibold text-[#111111]">GET</span>
            <span>{endpoint}</span>
          </div>
        </div>
      </div>

      {/* Middle/Bottom details */}
      <div className="space-y-4 pt-4 border-t border-[#EAEAEA]">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#787774] block font-mono uppercase text-[10px] tracking-wider">Latencia</span>
            <span className="font-mono text-[#111111] font-medium">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[#787774] block font-mono uppercase text-[10px] tracking-wider">Última revisión</span>
            <span className="font-mono text-[#111111]">
              {lastChecked ? lastChecked.toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>

        {/* Status Feedback / Response detail */}
        {status === 'error' && errorMessage && (
          <div className="p-3 rounded-md bg-[#FDEBEC] border border-[#F9D2D4] text-xs font-mono text-[#9F2F2D] break-words">
            {errorMessage}
          </div>
        )}

        {status === 'connected' && data && (
          <div className="p-3 rounded-md bg-[#F7F6F3] border border-[#EAEAEA] text-xs font-mono text-[#444444] overflow-x-auto">
            <pre className="text-[11px] leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <div className="pt-2">
            <button
              onClick={onRefresh}
              disabled={status === 'loading'}
              className="w-full py-2 px-3 rounded text-xs font-medium text-[#111111] bg-[#F7F6F3] hover:bg-[#EAEAEA] border border-[#EAEAEA] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Verificar Conexión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
