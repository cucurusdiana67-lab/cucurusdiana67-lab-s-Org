import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  DollarSign, 
  Package, 
  Tag, 
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';
import { formatRupiah } from '../../lib/imageHelper';

export interface CustomItemData {
  name: string;
  sellPrice: number;
  buyPrice: number;
  quantity: number;
  unit: string;
  category: string;
  notes?: string;
}

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomItem: (data: CustomItemData) => void;
}

const PRESET_SUGGESTIONS: Array<{
  name: string;
  category: string;
  sellPrice: number;
  buyPrice: number;
  unit: string;
}> = [
  { name: 'Isi Ulang Galon Air', category: 'Luar Aplikasi', sellPrice: 6000, buyPrice: 4000, unit: 'Galon' },
  { name: 'Gas Elpiji 3 Kg', category: 'Luar Aplikasi', sellPrice: 22000, buyPrice: 19000, unit: 'Tabung' },
  { name: 'Jasa Fotokopi / Cetak', category: 'Jasa & Layanan', sellPrice: 500, buyPrice: 200, unit: 'Lembar' },
  { name: 'Kantong Plastik / Kresek', category: 'Lain-lain', sellPrice: 500, buyPrice: 200, unit: 'Pcs' },
  { name: 'Kardus Bekas Packing', category: 'Lain-lain', sellPrice: 3000, buyPrice: 1500, unit: 'Pcs' },
  { name: 'Jasa Antar / Ongkir Toko', category: 'Jasa & Layanan', sellPrice: 5000, buyPrice: 0, unit: 'Trip' },
];

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onClose,
  onAddCustomItem,
}) => {
  const [name, setName] = useState('');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [buyPrice, setBuyPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unit, setUnit] = useState('Pcs');
  const [customUnit, setCustomUnit] = useState('');
  const [category, setCategory] = useState('Luar Aplikasi');
  const [notes, setNotes] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const STANDARD_UNITS = [
    'Pcs',
    'Bungkus',
    'Tabung',
    'Galon',
    'Lembar',
    'Kg',
    'Gram',
    'Liter',
    'Dus',
    'Botol',
    'Ikat',
    'Porsi',
    'Box',
    'Paket',
    'Trip'
  ];

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSellPrice('');
      setBuyPrice('');
      setQuantity(1);
      setUnit('Pcs');
      setCustomUnit('');
      setCategory('Luar Aplikasi');
      setNotes('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SUGGESTIONS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setSellPrice(preset.sellPrice);
    setBuyPrice(preset.buyPrice);
    if (STANDARD_UNITS.includes(preset.unit)) {
      setUnit(preset.unit);
      setCustomUnit('');
    } else {
      setUnit('Lainnya');
      setCustomUnit(preset.unit);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    const finalSellPrice = typeof sellPrice === 'number' ? sellPrice : (Number(sellPrice) || 0);
    const finalBuyPrice = typeof buyPrice === 'number' ? buyPrice : (Number(buyPrice) || 0);
    const finalQty = typeof quantity === 'number' && quantity > 0 ? quantity : (Number(quantity) || 1);
    const finalUnit = unit === 'Lainnya' ? (customUnit.trim() || 'Pcs') : unit.trim() || 'Pcs';

    if (!finalName) {
      alert('Silakan masukkan nama barang atau jasa!');
      return;
    }

    if (finalSellPrice <= 0) {
      alert('Harga jual harus lebih besar dari 0!');
      return;
    }

    onAddCustomItem({
      name: finalName,
      sellPrice: finalSellPrice,
      buyPrice: finalBuyPrice,
      quantity: finalQty,
      unit: finalUnit,
      category: category.trim() || 'Luar Aplikasi',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const currentQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  const currentSellPrice = typeof sellPrice === 'number' ? sellPrice : (Number(sellPrice) || 0);
  const currentBuyPrice = typeof buyPrice === 'number' ? buyPrice : (Number(buyPrice) || 0);
  const estimatedProfit = Math.max(0, (currentSellPrice - currentBuyPrice) * currentQty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-item-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="custom-item-modal-title" className="font-extrabold text-sm sm:text-base">
                Tambah Barang Luar / Manual
              </h3>
              <p className="text-[11px] text-amber-100">
                Input barang atau jasa non-katalog langsung ke kasir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Contoh Cepat (Klik untuk Mengisi):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-md text-[11px] font-medium transition"
                >
                  {preset.name} ({formatRupiah(preset.sellPrice)})
                </button>
              ))}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nama Barang / Jasa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Galon Aqua, Jasa Fotokopi, Gas 3kg..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Grid: Sell Price & Buy Price (Cost) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                {currentSellPrice > 0 && (
                  <span className="text-[10px] text-amber-700 font-mono font-bold">
                    {formatRupiah(currentSellPrice)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={sellPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setSellPrice('');
                    } else {
                      const num = Number(val);
                      setSellPrice(isNaN(num) ? '' : num);
                    }
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-2.5 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Harga Modal (HPP)
                </label>
                {currentBuyPrice > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatRupiah(currentBuyPrice)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setBuyPrice('');
                    } else {
                      const num = Number(val);
                      setBuyPrice(isNaN(num) ? '' : num);
                    }
                  }}
                  placeholder="0 (opsional)"
                  className="w-full pl-8 pr-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Jumlah (Qty) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity('');
                  } else {
                    const num = parseInt(val, 10);
                    setQuantity(isNaN(num) ? '' : num);
                  }
                }}
                onBlur={() => {
                  if (quantity === '' || (typeof quantity === 'number' && quantity < 1)) {
                    setQuantity(1);
                  }
                }}
                placeholder="1"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Bisa dikosongkan/dihapus untuk ketik angka baru
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Satuan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              >
                <option value="Pcs">Pcs / Buah</option>
                <option value="Bungkus">Bungkus</option>
                <option value="Tabung">Tabung</option>
                <option value="Galon">Galon</option>
                <option value="Lembar">Lembar</option>
                <option value="Kg">Kilogram (Kg)</option>
                <option value="Gram">Gram</option>
                <option value="Liter">Liter</option>
                <option value="Dus">Dus / Karton</option>
                <option value="Botol">Botol</option>
                <option value="Ikat">Ikat</option>
                <option value="Porsi">Porsi</option>
                <option value="Box">Box</option>
                <option value="Trip">Trip / Jasa</option>
                <option value="Paket">Paket</option>
                <option value="Lainnya">Lainnya (Ketik Manual)...</option>
              </select>

              {unit === 'Lainnya' && (
                <div className="mt-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Ketik satuan (mis: Meter, Rol, Kaleng...)"
                    className="w-full px-2.5 py-1.5 text-xs border border-amber-400 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Category & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="Luar Aplikasi">Luar Aplikasi</option>
                <option value="Jasa & Layanan">Jasa & Layanan</option>
                <option value="Sembako">Sembako</option>
                <option value="Makanan & Minuman">Makanan & Minuman</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Warna biru, merk X..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Estimation & Profit Preview */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Harga:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatRupiah(currentSellPrice * currentQty)}
              </span>
            </div>
            {currentBuyPrice > 0 && (
              <div className="flex items-center justify-between text-emerald-700 pt-1 border-t border-slate-200/60">
                <span className="flex items-center gap-1 text-[11px]">
                  <Info className="w-3 h-3 text-emerald-600" />
                  Estimasi Kontribusi Laba:
                </span>
                <span className="font-mono font-bold">
                  +{formatRupiah(estimatedProfit)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs flex items-center gap-1.5 transition active:scale-98"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Masukkan ke Keranjang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
