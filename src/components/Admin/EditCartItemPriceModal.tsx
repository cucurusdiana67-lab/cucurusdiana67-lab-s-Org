import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Check, AlertTriangle, RotateCcw, Percent, TrendingUp } from 'lucide-react';
import { CartItem, CustomerType } from '../../types';
import { formatRupiah } from '../../lib/imageHelper';

export interface EditCartItemPriceModalProps {
  isOpen: boolean;
  item?: CartItem | null;
  cartItem?: CartItem | null;
  customerType?: CustomerType;
  onClose: () => void;
  onSavePrice: (productId: string, newPrice: number) => void;
}

export const EditCartItemPriceModal: React.FC<EditCartItemPriceModalProps> = ({
  isOpen,
  item,
  cartItem,
  customerType = 'general',
  onClose,
  onSavePrice,
}) => {
  const activeItem = item || cartItem;
  const [price, setPrice] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute default price based on customer type and customPrice
  const originalSellPrice = activeItem?.product.sellPrice ?? 0;
  const wholesalePrice = activeItem?.product.wholesalePrice ?? 0;
  const buyCostPrice = activeItem?.product.buyPrice ?? 0;

  const standardPrice =
    customerType === 'wholesale' && wholesalePrice > 0
      ? wholesalePrice
      : originalSellPrice;

  useEffect(() => {
    if (isOpen && activeItem) {
      setErrorMsg(null);
      const initialPrice = activeItem.customPrice !== undefined ? activeItem.customPrice : standardPrice;
      setPrice(initialPrice);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeItem, standardPrice]);

  if (!isOpen || !activeItem) return null;

  const currentEnteredPrice = typeof price === 'number' ? price : 0;
  const currentMargin = currentEnteredPrice - buyCostPrice;
  const marginPercentage =
    buyCostPrice > 0 ? Math.round((currentMargin / buyCostPrice) * 100) : 0;

  const handleApplyPreset = (presetVal: number) => {
    setPrice(Math.max(0, presetVal));
    setErrorMsg(null);
    inputRef.current?.focus();
  };

  const handleApplyDiscount = (discountAmount: number, isPercent = false) => {
    const base = typeof price === 'number' && price > 0 ? price : standardPrice;
    let newP = base;
    if (isPercent) {
      newP = Math.round(base * (1 - discountAmount / 100));
    } else {
      newP = base - discountAmount;
    }
    handleApplyPreset(newP);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price === '' || isNaN(Number(price))) {
      setErrorMsg('Masukkan angka harga yang valid');
      return;
    }
    const finalPrice = Number(price);
    if (finalPrice < 0) {
      setErrorMsg('Harga tidak boleh bernilai negatif');
      return;
    }

    onSavePrice(activeItem.product.id, finalPrice);
    onClose();
  };

  return (
    <div
      id="edit-cart-price-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-price-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-price-modal-title" className="font-bold text-sm truncate">
                Ubah Harga Satuan Transaksi
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                Berlaku khusus untuk transaksi keranjang saat ini
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-edit-price-modal-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {/* Product info card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nama Barang:
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 line-clamp-2">
                {activeItem.product.name}
              </h4>
              {activeItem.product.barcode && (
                <span className="inline-block text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded mt-1">
                  Barcode: {activeItem.product.barcode}
                </span>
              )}
            </div>

            {/* Price reference grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Harga Umum</span>
                <span className="font-mono font-bold text-slate-700">
                  {formatRupiah(originalSellPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Harga Borongan</span>
                <span className="font-mono font-bold text-blue-700">
                  {wholesalePrice > 0 ? formatRupiah(wholesalePrice) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Harga Modal</span>
                <span className="font-mono font-bold text-amber-700">
                  {buyCostPrice > 0 ? formatRupiah(buyCostPrice) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">
              Pilihan Cepat / Preset:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(originalSellPrice)}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition border border-slate-200"
              >
                Harga Umum ({formatRupiah(originalSellPrice)})
              </button>

              {wholesalePrice > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset(wholesalePrice)}
                  className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold transition border border-blue-200"
                >
                  Harga Borongan ({formatRupiah(wholesalePrice)})
                </button>
              )}

              {buyCostPrice > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset(buyCostPrice)}
                  className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-semibold transition border border-amber-200"
                >
                  Harga Modal ({formatRupiah(buyCostPrice)})
                </button>
              )}

              <button
                type="button"
                onClick={() => handleApplyDiscount(500)}
                className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition border border-emerald-200"
              >
                -Rp 500
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscount(1000)}
                className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition border border-emerald-200"
              >
                -Rp 1.000
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscount(2000)}
                className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition border border-emerald-200"
              >
                -Rp 2.000
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscount(5, true)}
                className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition border border-emerald-200 flex items-center gap-0.5"
              >
                <Percent className="w-3 h-3" />
                <span>5%</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscount(10, true)}
                className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold transition border border-emerald-200 flex items-center gap-0.5"
              >
                <Percent className="w-3 h-3" />
                <span>10%</span>
              </button>
            </div>
          </div>

          {/* New Price Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal-custom-price-input" className="block text-xs font-bold text-slate-800">
                Harga Satuan Baru (Rp) *
              </label>
              {typeof price === 'number' && price > 0 && (
                <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatRupiah(price)}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 font-mono">
                Rp
              </span>
              <input
                ref={inputRef}
                id="modal-custom-price-input"
                type="number"
                min="0"
                step="any"
                required
                value={price}
                onChange={(e) => {
                  setErrorMsg(null);
                  const val = e.target.value;
                  if (val === '') {
                    setPrice('');
                  } else {
                    const num = Number(val);
                    setPrice(isNaN(num) ? '' : num);
                  }
                }}
                placeholder="Ketik harga baru..."
                className="w-full pl-11 pr-4 py-2.5 text-base font-mono font-bold border-2 border-emerald-500/80 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:outline-none bg-emerald-50/20"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}

            {/* Profit margin preview & warning */}
            {typeof price === 'number' && buyCostPrice > 0 && (
              <div className="mt-2.5">
                {currentEnteredPrice < buyCostPrice ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-bold">Peringatan: Harga di bawah modal!</span>
                      <span className="block text-[11px]">
                        Rugi sebesar {formatRupiah(buyCostPrice - currentEnteredPrice)} per barang.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Margin Laba:
                    </span>
                    <span className="font-bold">
                      +{formatRupiah(currentMargin)} ({marginPercentage}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              id="reset-price-to-default-btn"
              onClick={() => handleApplyPreset(standardPrice)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Asli</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-edit-price-btn"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                id="submit-edit-price-btn"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg shadow-2xs flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Harga</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
