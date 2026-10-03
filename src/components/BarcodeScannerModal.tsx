import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Barcode, AlertCircle, ScanLine } from 'lucide-react';
import { playBeep } from '../lib/soundHelper';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode Produk',
  subtitle = 'Arahkan kamera HP ke garis barcode atau ketik kodenya',
}) => {
  const [manualInput, setManualInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const containerId = 'barcode-camera-reader-viewport';

  useEffect(() => {
    let isCancelled = false;

    if (isOpen) {
      setErrorMsg(null);
      setManualInput('');
      isStoppingRef.current = false;

      // Small delay for DOM mounting
      const timer = setTimeout(() => {
        if (!isCancelled) {
          startScanner();
        }
      }, 150);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setErrorMsg(null);

      const elem = document.getElementById(containerId);
      if (!elem) {
        setIsScanning(false);
        return;
      }

      // Ensure any existing scanner is cleared
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.max(240, Math.floor(viewfinderWidth * 0.85)),
              height: Math.max(140, Math.floor(minDim * 0.65)),
            };
          },
          aspectRatio: 1.3333,
        },
        async (decodedText) => {
          if (isStoppingRef.current) return;
          isStoppingRef.current = true;

          playBeep(980, 0.12);
          await stopScanner();
          onScanSuccess(decodedText.trim());
          onClose();
        },
        () => {
          // Scan frame miss (normal cycle)
        }
      );

      setCameraActive(true);
    } catch (err: unknown) {
      const e = err as Error;
      setIsScanning(false);
      setCameraActive(false);
      const isPermission =
        e.name === 'NotAllowedError' ||
        e.message?.toLowerCase().includes('permission') ||
        e.message?.toLowerCase().includes('denied');

      setErrorMsg(
        isPermission
          ? 'Izin kamera ditolak oleh browser. Mohon izinkan akses kamera di pengaturan situs atau masukkan barcode manual di bawah.'
          : 'Kamera tidak dapat diakses atau sedang dipakai aplikasi lain. Anda dapat memasukkan kode barcode secara manual.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setCameraActive(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = manualInput.trim();
    if (cleanCode) {
      isStoppingRef.current = true;
      playBeep(980, 0.12);
      await stopScanner();
      onScanSuccess(cleanCode);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{title}</span>
                {cameraActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            id="close-barcode-modal-btn"
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner view */}
        <div className="p-4 space-y-3.5">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-700 shadow-inner">
            <div id={containerId} className="w-full h-full min-h-[220px]"></div>

            {/* Visual scan laser indicator overlay when camera is active */}
            {cameraActive && !errorMsg && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[80%] h-36 border-2 border-emerald-400/60 rounded-lg relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                    Posisikan Garis Barcode di Sini
                  </span>
                </div>
              </div>
            )}

            {isScanning && !cameraActive && !errorMsg && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ScanLine className="w-8 h-8 text-emerald-400 animate-pulse" />
                <span className="text-xs">Menghubungkan kamera HP...</span>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center z-10">
                <AlertCircle className="w-7 h-7 text-amber-400 mb-1.5" />
                <p className="text-xs text-slate-200 mb-3 max-w-xs">{errorMsg}</p>
                <button
                  id="retry-camera-btn"
                  type="button"
                  onClick={startScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Akses Kamera Lagi
                </button>
              </div>
            )}
          </div>

          {/* Quick preset barcode buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">
              Contoh Barcode Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Beras 5kg', code: '8992753110111' },
                { name: 'Minyak 2L', code: '8999999001234' },
                { name: 'Indomie Dus', code: '8998866200212' },
                { name: 'Kopi Kapal Api', code: '8996001301111' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={async () => {
                    playBeep(980, 0.12);
                    await stopScanner();
                    onScanSuccess(item.code);
                    onClose();
                  }}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2 py-1 rounded-md font-mono transition"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="manual-barcode-input"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ketik kode barcode manual..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              id="submit-manual-barcode-btn"
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold transition shadow-2xs shrink-0"
            >
              Gunakan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
