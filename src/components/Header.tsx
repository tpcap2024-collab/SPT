import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="sticky top-0 z-40 h-16 sm:h-20 bg-white border-b-2 border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">Smart Pallet Tracking</h1>
          <p className="text-[9px] sm:text-xs font-semibold text-blue-600 uppercase tracking-widest">Warehouse Logistics</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <div className="text-base sm:text-xl font-bold text-slate-700">{formatTime(time)}</div>
          <div className="text-[10px] sm:text-sm text-slate-500 font-medium">{formatDate(time)}</div>
        </div>
        <button 
          onClick={onSettingsClick}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
