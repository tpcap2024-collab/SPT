import {
  Settings,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({
  onSettingsClick,
}: HeaderProps) {
  const [time, setTime] =
    useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setTime(new Date());
      },
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const formatDate = (
    date: Date
  ) => {
    return date.toLocaleDateString(
      'th-TH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const formatTime = (
    date: Date
  ) => {
    return date.toLocaleTimeString(
      'th-TH',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    );
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          /spt-logo.png

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">
              Smart Pallet Tracking
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Warehouse Logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-lg font-black text-blue-700 leading-none">
              {formatTime(time)}
            </span>

            <span className="text-xs font-semibold text-slate-500 mt-1">
              {formatDate(time)}
            </span>
          </div>

          {onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              aria-label="ตั้งค่าระบบ"
              className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center active:bg-blue-100 active:text-blue-700 transition-colors"
            >
              <Settings
                size={22}
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>
      </div>

      <div className="sm:hidden max-w-3xl mx-auto px-4 pb-3 flex items-center justify-between">
        <span className="text-sm font-black text-blue-700">
          {formatTime(time)}
        </span>

        <span className="text-xs font-semibold text-slate-500">
          {formatDate(time)}
        </span>
      </div>
    </header>
  );
}
