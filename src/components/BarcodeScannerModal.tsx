import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Barcode, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode Produk',
}) => {
  const [manualInput, setManualInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-reader-box';

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setManualInput('');
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      // Wait a tick for DOM element to mount
      await new Promise((r) => setTimeout(r, 200));

      const elem = document.getElementById(containerId);
      if (!elem) return;

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.33,
        },
        (decodedText) => {
          // Play audio beep sound
          playBeep();
          stopScanner();
          onScanSuccess(decodedText);
          onClose();
        },
        () => {
          // Scan frame miss (normal)
        }
      );
    } catch (err: unknown) {
      const e = err as Error;
      setIsScanning(false);
      setErrorMsg(
        e.message?.includes('Permission')
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera atau gunakan input barcode manual di bawah.'
          : 'Kamera tidak ditemukan atau sedang digunakan aplikasi lain. Anda dapat memasukkan barcode manual.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio not permitted without gesture
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      playBeep();
      stopScanner();
      onScanSuccess(manualInput.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="barcode-scanner-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
          <button
            id="close-barcode-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner view */}
        <div className="p-4 space-y-4">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-700">
            <div id={containerId} className="w-full h-full min-h-[220px]"></div>

            {errorMsg && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-slate-300 mb-3">{errorMsg}</p>
                <button
                  id="retry-camera-btn"
                  onClick={startScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Kamera Lagi
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500">
            Arahkan kamera ke barcode produk atau masukkan nomor barcode di bawah.
          </div>

          {/* Quick preset barcode buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500">Contoh Barcode Cepat:</span>
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
                  onClick={() => {
                    playBeep();
                    stopScanner();
                    onScanSuccess(item.code);
                    onClose();
                  }}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2.5 py-1 rounded-md transition"
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
                placeholder="Ketik kode barcode..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              id="submit-manual-barcode-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Gunakan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
