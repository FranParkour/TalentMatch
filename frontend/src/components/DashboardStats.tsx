import React from 'react';
import { DashboardStats as DashboardStatsType } from '../types/dashboard';

interface DashboardStatsProps {
  stats: DashboardStatsType | null;
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="editorial-card p-5 animate-pulse space-y-3 bg-white">
            <div className="h-3 bg-[#EEEEEE] rounded w-1/2" />
            <div className="h-8 bg-[#EEEEEE] rounded w-1/3" />
            <div className="h-2.5 bg-[#F4F4F4] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Ofertas Activas',
      value: stats ? stats.active_offers : 0,
      description: 'Convocatorias abiertas a postulación',
      icon: (
        <span className="w-2 h-2 rounded-full bg-[#28572E] ring-4 ring-[#EBF5EC]" />
      ),
      badgeClass: 'bg-[#EBF5EC] text-[#28572E] border-[#D5EBD7]',
    },
    {
      label: 'Total de CVs',
      value: stats ? stats.total_cvs : 0,
      description: 'Documentos recibidos en el sistema',
      icon: (
        <svg className="w-4 h-4 text-[#555555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badgeClass: 'bg-[#F7F6F3] text-[#555555] border-[#EAEAEA]',
    },
    {
      label: 'CVs Evaluados',
      value: stats ? stats.evaluated_cvs : 0,
      description: 'Análisis completados con IA',
      icon: (
        <svg className="w-4 h-4 text-[#1E40AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeClass: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]',
    },
    {
      label: 'Evaluaciones Pendientes',
      value: stats ? stats.pending_cvs : 0,
      description: 'CVs procesados listos para evaluar',
      icon: (
        <svg className="w-4 h-4 text-[#B45309]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeClass: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="editorial-card p-5 bg-white border border-[#EAEAEA] rounded-xl flex flex-col justify-between hover:border-[#CCCCCC] transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
              {item.label}
            </span>
            <div className="shrink-0">{item.icon}</div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-serif font-bold text-[#111111] tracking-tight">
              {item.value}
            </div>
          </div>

          <p className="text-[11px] text-[#888888] font-sans truncate">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
};
