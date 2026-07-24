import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  X,
  Camera,
  RefreshCw,
  ScanLine,
} from 'lucide-react';

import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';

interface ScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function Scanner({
  onScan,
  onClose,
}: ScannerProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const controlsRef =
    useRef<IScannerControls | null>(null);

  const readerRef =
    useRef<BrowserMultiFormatReader | null>(
      null
    );

  const hasScannedRef =
    useRef(false);

  const onScanRef = useRef(onScan);

  const [isStarting, setIsStarting] =
    useState(true);

  const [scannerError, setScannerError] =
    useState('');

  const [lastResult, setLastResult] =
    useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    const videoElement =
      videoRef.current;

    if (
      videoElement &&
      videoElement.srcObject
    ) {
      const stream =
        videoElement.srcObject as MediaStream;

      stream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      videoElement.srcObject = null;
    }

    readerRef.current = null;
  };

  const startScanner = async () => {
    stopScanner();

    setScannerError('');
    setLastResult('');
    setIsStarting(true);

    hasScannedRef.current = false;

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setScannerError(
        'อุปกรณ์หรือ Browser นี้ไม่รองรับการเปิดกล้อง'
      );

      setIsStarting(false);
      return;
    }

    const videoElement =
      videoRef.current;

    if (!videoElement) {
      setScannerError(
        'ไม่พบส่วนแสดงภาพจากกล้อง'
      );

      setIsStarting(false);
      return;
    }

    try {
      const codeReader =
        new BrowserMultiFormatReader();

      readerRef.current = codeReader;

      const controls =
        await codeReader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: {
                ideal: 'environment',
              },
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            },
          },
          videoElement,
          (
            result,
            error,
            activeControls
          ) => {
            if (
              !result ||
              hasScannedRef.current
            ) {
              return;
            }

            const scannedText =
              result
                .getText()
                .trim();

            if (!scannedText) {
              return;
            }

            hasScannedRef.current = true;

            setLastResult(
              scannedText
            );

            activeControls.stop();

            window.setTimeout(() => {
              onScanRef.current(
                scannedText
              );
            }, 250);
          }
        );

      controlsRef.current = controls;
      setIsStarting(false);
    } catch (error: unknown) {
      console.error(
        'Scanner start error:',
        error
      );

      const errorName =
        error instanceof DOMException
          ? error.name
          : '';

      if (
        errorName ===
          'NotAllowedError' ||
        errorName ===
          'PermissionDeniedError'
      ) {
        setScannerError(
          'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตสิทธิ์กล้องในการตั้งค่า Browser'
        );
      } else if (
        errorName ===
          'NotFoundError' ||
        errorName ===
          'DevicesNotFoundError'
      ) {
        setScannerError(
          'ไม่พบกล้องบนอุปกรณ์นี้'
        );
      } else if (
        errorName ===
          'NotReadableError' ||
        errorName ===
          'TrackStartError'
      ) {
        setScannerError(
          'ไม่สามารถเปิดกล้องได้ กล้องอาจกำลังถูกใช้งานโดยแอปอื่น'
        );
      } else {
        setScannerError(
          'ไม่สามารถเริ่มระบบสแกนได้ กรุณาลองใหม่'
        );
      }

      setIsStarting(false);
      stopScanner();
    }
  };

  useEffect(() => {
    void startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleRetry = () => {
    void startScanner();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 text-white bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <div>
          <h2 className="text-xl font-bold drop-shadow-md">
            Scan Route Barcode
          </h2>

          <p className="text-white/70 text-xs mt-1">
            สแกนบาร์โค้ดหรือ QR Code ของ Route
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="ปิดเครื่องสแกน"
          className="p-2 rounded-full bg-white/20 active:bg-white/40 transition-colors backdrop-blur-sm"
        >
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 w-[85vw] max-w-md h-52 border-2 border-white/60 rounded-2xl overflow-hidden">
          {!scannerError && (
            <div className="absolute left-0 right-0 h-1 bg-green-400 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_14px_rgba(74,222,128,1)]" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {isStarting ? (
              <>
                <RefreshCw
                  size={36}
                  className="text-white animate-spin mb-3"
                />

                <p className="text-white font-bold text-sm drop-shadow-md">
                  กำลังเปิดกล้อง
                </p>
              </>
            ) : scannerError ? (
              <>
                <Camera
                  size={42}
                  className="text-red-300 mb-3"
                />

                <p className="text-white font-bold text-sm text-center px-6 drop-shadow-md">
                  ไม่สามารถใช้กล้องได้
                </p>
              </>
            ) : lastResult ? (
              <>
                <ScanLine
                  size={42}
                  className="text-green-400 mb-3"
                />

                <p className="text-green-300 font-bold text-lg text-center px-6 drop-shadow-md">
                  {lastResult}
                </p>
              </>
            ) : (
              <>
                <ScanLine
                  size={38}
                  className="text-white mb-3"
                />

                <p className="text-white font-bold text-sm drop-shadow-md">
                  วางบาร์โค้ดให้อยู่ในกรอบ
                </p>

                <p className="text-white/70 text-xs mt-2 drop-shadow-md">
                  ระบบจะอ่านอัตโนมัติ
                </p>
              </>
            )}
          </div>

          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />

          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />

          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />

          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
        </div>

        {scannerError && (
          <div className="absolute left-4 right-4 bottom-10 z-20 bg-red-950/90 border border-red-500/60 rounded-2xl p-4 text-center backdrop-blur-md">
            <p className="text-white text-sm font-semibold mb-4">
              {scannerError}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="bg-white text-red-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto active:scale-95 transition-transform"
            >
              <RefreshCw size={18} />
              ลองเปิดกล้องใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
