import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Tag, Check } from 'lucide-react';
import { CartItem } from '../../types';
import { formatRupiah } from '../../lib/imageHelper';

interface EditCartItemPriceModalProps {
  isOpen: boolean;
  item: CartItem | null;
  onClose: () => void;
  onSavePrice: (productId: string, newPrice: number) => void;
}

export const EditCartItemPriceModal: React.FC<EditCartItemPriceModalProps> = ({
  isOpen,
  item,
  onClose,
  onSavePrice,
}) => {
  const [price, setPrice] = useState<number | ''>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      setPrice(item.customPrice ?? item.product.sellPrice);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = Number(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      alert('Harga harus berupa angka 0 atau lebih!');
      return;
    }
    onSavePrice(item.product.id, finalPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-price-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 id="edit-price-modal-title" className="font-bold text-xs sm:text-sm">
              Ubah Harga Satuan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-3.5">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Nama Produk:
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5">
              {item.product.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Harga Asli: {formatRupiah(item.product.sellPrice)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Harga Satuan Baru
              </label>
              {typeof price === 'number' && price > 0 && (
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  {formatRupiah(price)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                Rp
              </span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setPrice('');
                  } else {
                    const num = Number(val);
                    setPrice(isNaN(num) ? '' : num);
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Harga ini akan digunakan khusus untuk transaksi kasir ini.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Harga</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
