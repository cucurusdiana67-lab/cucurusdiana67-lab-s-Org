import React, { useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { formatRupiah } from '../../lib/imageHelper';
import { printRestockReceipt } from '../../lib/receiptPrinter';
import { 
  ShoppingBag, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  Plus, 
  Minus,
  RefreshCw
} from 'lucide-react';

interface AdminRestockBonProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshProducts: () => void;
}

export const AdminRestockBon: React.FC<AdminRestockBonProps> = ({
  products,
  settings,
  onRefreshProducts,
}) => {
  const [quickAddStockId, setQuickAddStockId] = useState<string | null>(null);
  const [addedAmount, setAddedAmount] = useState<number>(10);

  // Filter products where stock is <= minStock (or out of stock)
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Group by category
  const categories = Array.from(new Set(lowStockProducts.map((p) => p.category))).sort();

  // Total estimated restock budget
  const totalEstimatedBudget = lowStockProducts.reduce((sum, p) => {
    const qtyToBuy = Math.max(1, p.minStock * 2 - p.stock);
    return sum + qtyToBuy * p.buyPrice;
  }, 0);

  const handlePrint = () => {
    if (lowStockProducts.length === 0) {
      alert('Tidak ada barang yang perlu dibeli/restock saat ini!');
      return;
    }
    printRestockReceipt(lowStockProducts, settings);
  };

  const handleQuickRestock = (product: Product) => {
    const newStock = product.stock + addedAmount;
    storage.saveProduct({
      ...product,
      stock: newStock,
    });
    onRefreshProducts();
    setQuickAddStockId(null);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Bon Belanja & Daftar Restock Otomatis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Daftar otomatis barang yang stoknya di bawah batas minimal, dikelompokkan per kategori untuk dibawa belanja ke pasar/supplier.
          </p>
        </div>

        <button
          id="print-bon-belanja-btn"
          type="button"
          onClick={handlePrint}
          disabled={lowStockProducts.length === 0}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Cetak Bon Belanja Thermal</span>
        </button>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-xs text-amber-800 font-semibold">Barang Perlu Dibeli</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-900">
            {lowStockProducts.length} Macam Produk
          </div>
          <div className="text-[11px] text-amber-700">Stok menipis atau habis</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Estimasi Kategori Belanja</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {categories.length} Kategori
          </div>
          <div className="text-[11px] text-slate-400">Rapi terurut per rak/lorong</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-xs text-emerald-800 font-semibold">Estimasi Modal Belanja</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
            {formatRupiah(totalEstimatedBudget)}
          </div>
          <div className="text-[11px] text-emerald-600">Berdasarkan harga beli/kulakan</div>
        </div>
      </div>

      {/* Grouped Category Bon List */}
      {lowStockProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Semua Stok Barang Aman!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada produk yang berada di bawah batas stok minimum saat ini. Toko Anda siap melayani pelanggan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = lowStockProducts.filter((p) => p.category === cat);
            return (
              <div
                key={cat}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kategori: {cat}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {catItems.length} Produk
                  </span>
                </div>

                {/* Items in this category */}
                <div className="divide-y divide-slate-100">
                  {catItems.map((item) => {
                    const neededQty = Math.max(1, item.minStock * 2 - item.stock);
                    const estimatedCost = neededQty * item.buyPrice;
                    const isQuickRestock = quickAddStockId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center text-slate-400 mt-0.5">
                            <span className="text-[10px]">☐</span>
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                              <span className="text-red-600 font-semibold">
                                Sisa Stok: {item.stock} {item.unit}
                              </span>
                              <span>Batas Min: {item.minStock} {item.unit}</span>
                              <span>Harga Beli: {formatRupiah(item.buyPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Estimated purchase qty & cost */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-700">
                              Beli: {neededQty} {item.unit}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Est. {formatRupiah(estimatedCost)}
                            </div>
                          </div>

                          {/* Quick Add Stock Button */}
                          <div>
                            {isQuickRestock ? (
                              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-emerald-300">
                                <input
                                  type="number"
                                  min="1"
                                  value={addedAmount}
                                  onChange={(e) => setAddedAmount(Number(e.target.value))}
                                  className="w-14 px-1.5 py-0.5 text-xs font-bold text-center border border-slate-200 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuickRestock(item)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickAddStockId(null)}
                                  className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-[11px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickAddStockId(item.id);
                                  setAddedAmount(neededQty);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Input Masuk Stok</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
