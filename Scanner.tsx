import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function Scanner({ onScan, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulateScan = () => {
    // Simulating a successful scan
    onScan('Route 02 - South');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-200">
      <div className="flex justify-between items-center p-4 text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <h2 className="text-xl font-bold drop-shadow-md">Scan Route Barcode</h2>
        <button 
          onClick={onClose} 
          className="p-2 rounded-full bg-white/20 active:bg-white/40 transition-colors backdrop-blur-sm"
        >
          <X size={28} />
        </button>
      </div>
      
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-900" 
        onClick={handleSimulateScan}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
        />
        
        {/* Scanner frame */}
        <div className="w-72 h-40 border-2 border-white/50 rounded-2xl relative z-10 flex flex-col items-center justify-center overflow-hidden backdrop-blur-[1px]">
          {/* Scanning line animation */}
          <div className="w-full h-1 bg-green-400 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_12px_rgba(74,222,128,1)]"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-white font-bold text-sm drop-shadow-md mb-1">Align barcode within frame</p>
            <p className="text-white/70 text-[11px] drop-shadow-md">(Tap anywhere to simulate scan)</p>
          </div>
          
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl"></div>
        </div>
      </div>
    </div>
  );
}
