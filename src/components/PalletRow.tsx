import React, { useRef, useEffect } from 'react';
import { PalletType } from '../types';
import { Minus, Plus } from 'lucide-react';

interface PalletRowProps {
  type: PalletType;
  value: string;
  isFocused: boolean;
  onFocus: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const DOT_COLORS: Record<PalletType, string> = {
  'Green': 'bg-green-500',
  'Cream': 'bg-orange-100 border border-slate-300',
  'Blue': 'bg-blue-500',
  'Box Sleeve': 'bg-slate-400',
  'Wing': 'bg-indigo-500',
  'Glass': 'bg-cyan-200',
  'Wood': 'bg-amber-700',
};

export const PalletRow: React.FC<PalletRowProps> = ({ type, value, isFocused, onFocus, onIncrement, onDecrement }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && rowRef.current) {
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [isFocused]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrement();
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDecrement();
  };

  return (
    <div 
      ref={rowRef}
      className={`flex items-center justify-between p-2 mb-2 rounded-xl transition-all ${
        isFocused ? 'bg-blue-50 border-2 border-blue-400 shadow-inner' : 'bg-slate-50 border border-slate-200'
      }`}
      onClick={onFocus}
    >
      <span className={`text-base font-bold flex items-center gap-2 ${isFocused ? 'text-slate-700' : 'text-slate-600'}`}>
        <span className={`w-3 h-3 rounded-full ${DOT_COLORS[type] || 'bg-gray-400'}`}></span> {type}
      </span>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleDecrement}
          className="w-10 h-10 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center active:bg-slate-300 transition-colors"
        >
          <Minus size={20} strokeWidth={3} />
        </button>
        <div 
          className={`w-16 py-1.5 rounded-lg text-center text-xl font-black transition-colors ${
            isFocused ? 'bg-white text-blue-800 shadow-sm' : 'bg-white border border-slate-200 text-slate-400'
          }`}
        >
          {value || '0'}
        </div>
        <button 
          onClick={handleIncrement}
          className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center active:bg-blue-200 transition-colors"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
