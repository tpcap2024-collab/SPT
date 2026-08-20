import {
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({
  onSettingsClick: _onSettingsClick,
}: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
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
      hour12: false,
    });
  };

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (
        typeof document.documentElement.requestFullscreen !==
        'function'
      ) {
        alert('Browser นี้ไม่รองรับโหมด Full Screen');
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Fullscreen error:', error);
      alert('ไม่สามารถเปิดโหมด Full Screen ได้');
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/spt-logo.png"
            alt="SPT Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0 shadow-sm"
          />

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
          <div className="flex flex-col items-end mr-1">
            <span className="text-lg sm:text-xl font-black text-blue-700 leading-none">
              {formatTime(time)}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 whitespace-nowrap">
              {formatDate(time)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label={
              isFullscreen
                ? 'ออกจากโหมดเต็มหน้าจอ'
                : 'เปิดโหมดเต็มหน้าจอ'
            }
            title={
              isFullscreen
                ? 'ออกจาก Full Screen'
                : 'Full Screen'
            }
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-colors ${
              isFullscreen
                ? 'bg-blue-600 text-white border-blue-600 active:bg-blue-700'
                : 'bg-blue-50 text-blue-700 border-blue-200 active:bg-blue-100'
            }`}
          >
            {isFullscreen ? (
              <Minimize2 size={22} strokeWidth={2.5} />
            ) : (
              <Maximize2 size={22} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
