import { Delete, Check, ChevronDown } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onHide: () => void;
  isVisible: boolean;
  title?: string;
  currentValue?: string;
  zIndex?: number;
}

export function Keypad({ onKeyPress, onDelete, onConfirm, onHide, isVisible, title, currentValue, zIndex = 60 }: KeypadProps) {
  if (!isVisible) return null;

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9'
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t-0 p-4 pb-8 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-200 rounded-t-3xl"
      style={{ zIndex }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-4 relative">
        <button 
          onClick={onHide} 
          className="absolute right-0 top-0 text-slate-400 p-2 active:bg-slate-700 rounded-full transition-colors z-10"
        >
          <ChevronDown size={28} />
        </button>

        {title && (
          <div className="text-center mb-1 mt-1">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Entering for: {title}</p>
            <div className="text-5xl font-mono font-bold text-white tracking-tighter h-12 flex items-center justify-center">
              {currentValue || '0'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {buttons.map((btn) => (
            <button
              key={btn}
              onClick={() => onKeyPress(btn)}
              className="bg-slate-700 text-white text-3xl font-bold rounded-2xl h-16 active:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
            >
              {btn}
            </button>
          ))}
          
          <button
            onClick={onDelete}
            className="bg-[#3f2a2f] text-red-500 h-16 rounded-2xl active:bg-red-900 active:text-white transition-all shadow-md flex items-center justify-center"
          >
            <Delete size={28} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => onKeyPress('0')}
            className="bg-slate-700 text-white text-3xl font-bold rounded-2xl h-16 active:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            0
          </button>
          
          <button
            onClick={onConfirm}
            className="bg-[#00a843] text-white h-16 rounded-2xl active:bg-green-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            <Check size={32} strokeWidth={3.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
