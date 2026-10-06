import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  durationMs?: number;
}

export const Toast = ({
  message,
  type = 'success',
  onClose,
  durationMs = 4000,
}: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  const typeStyles = {
    success: 'bg-[#0F5132]/90 text-white border-[#0F5132]',
    error: 'bg-[#842029]/90 text-white border-[#842029]',
    info: 'bg-[#111111]/90 text-white border-[#333333]',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium backdrop-blur-sm ${typeStyles[type]}`}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-75 text-sm leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};
