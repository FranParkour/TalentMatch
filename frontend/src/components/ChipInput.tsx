import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface ChipInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  badgeColor?: 'blue' | 'purple' | 'gray' | 'emerald';
}

export const ChipInput = ({
  label,
  description,
  placeholder = 'Escribe y presiona Enter...',
  items,
  onChange,
  badgeColor = 'gray',
}: ChipInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  };

  const colorStyles = {
    gray: 'bg-[#F4F4F2] text-[#333333] border-[#E5E5E0] hover:bg-[#EAEAE6]',
    blue: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE] hover:bg-[#DBEAFE]',
    purple: 'bg-[#FAF5FF] text-[#6B21A8] border-[#F3E8FF] hover:bg-[#F3E8FF]',
    emerald: 'bg-[#ECFDF5] text-[#065F46] border-[#D1FAE5] hover:bg-[#D1FAE5]',
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
          {label}
        </label>
        {description && (
          <span className="text-xs text-[#787774] mt-0.5">{description}</span>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-white border border-[#EAEAEA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all placeholder:text-[#AAAAAA]"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-3.5 py-2 text-xs font-medium bg-[#111111] text-white rounded-md hover:bg-[#333333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          + Agregar
        </button>
      </div>

      {/* Chips Container */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${colorStyles[badgeColor]}`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-black/10 text-current transition-colors"
                title={`Eliminar ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#999999] italic">
          No hay elementos agregados aún.
        </p>
      )}
    </div>
  );
};
