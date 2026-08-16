import React, { useState, useEffect } from 'react';
import { Product, Order, StoreSettings, CartItem, PaymentMethod } from '../../types';
import { storage } from '../../lib/storage';
import { formatImageUrl, formatRupiah } from '../../lib/imageHelper';
import { printThermalReceipt } from '../../lib/receiptPrinter';
import { BarcodeScannerModal } from '../BarcodeScannerModal';
import { 
  Camera, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CreditCard, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  User as UserIcon, 
  Percent, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminPOSProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshProducts: () => void;
}

export const AdminPOS: React.FC<AdminPOSProps> = ({
  products,
  settings,
  onRefreshProducts,
}) => {
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Checkout POS state
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products for quick search & add
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate totals
  const subtotal = posCart.reduce((sum, item) => sum + (item.customPrice ?? item.product.sellPrice) * item.quantity, 0);
  const totalBuyCost = posCart.reduce((sum, item) => sum + item.product.buyPrice * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - globalDiscount);
  const profit = Math.max(0, finalTotal - totalBuyCost);

  // Calculate remaining debt based on payment method
  const remainingDebt =
    paymentMethod === 'debt_full'
      ? finalTotal
      : paymentMethod === 'debt_partial'
      ? Math.max(0, finalTotal - downPayment)
      : 0;

  const actualAmountPaid =
    paymentMethod === 'cash'
      ? Math.min(cashGiven, finalTotal)
      : paymentMethod === 'debt_partial'
      ? downPayment
      : paymentMethod === 'debt_full'
      ? 0
      : finalTotal;

  const change = paymentMethod === 'cash' ? Math.max(0, cashGiven - finalTotal) : 0;

  // Add to POS Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok ${product.name} telah habis!`);
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok tidak mencukupi (tersedia: ${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (qty > product.stock) {
      alert(`Stok maksimal tersedia: ${product.stock}`);
      return;
    }

    setPosCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPosCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleScanSuccess = (barcode: string) => {
    const product = products.find((p) => p.barcode && p.barcode.trim() === barcode.trim());
    if (product) {
      handleAddToCart(product);
    } else {
      alert(`Produk dengan barcode "${barcode}" tidak ditemukan di database.`);
    }
  };

  const handleCompleteTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    if ((paymentMethod === 'debt_partial' || paymentMethod === 'debt_full') && !customerName.trim()) {
      alert('Nama pelanggan wajib diisi untuk transaksi hutang!');
      return;
    }

    if (paymentMethod === 'cash' && cashGiven < finalTotal) {
      alert(`Uang tunai kurang dari total belanja! Total: ${formatRupiah(finalTotal)}`);
      return;
    }

    const orderNumber = 'POS-' + Date.now().toString().slice(-6);
    const newOrder: Order = {
      id: 'ord-pos-' + Date.now(),
      orderNumber,
      type: 'pos',
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone.trim(),
      items: posCart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        category: item.product.category,
        buyPrice: item.product.buyPrice,
        sellPrice: item.customPrice ?? item.product.sellPrice,
        quantity: item.quantity,
        subtotal: (item.customPrice ?? item.product.sellPrice) * item.quantity,
      })),
      subtotal,
      totalDiscount: globalDiscount,
      totalAmount: finalTotal,
      totalBuyCost,
      profit,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? cashGiven : actualAmountPaid,
      remainingDebt,
      status: 'completed',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    storage.createOrder(newOrder);
    onRefreshProducts();
    setLastCompletedOrder(newOrder);
    
    // Auto trigger receipt print
    printThermalReceipt(newOrder, settings);

    // Reset POS cart
    setPosCart([]);
    setGlobalDiscount(0);
    setCashGiven(0);
    setDownPayment(0);
    setNotes('');
    setCustomerName('Pelanggan Umum');
    setCustomerPhone('');

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Barcode Kasir Toko"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Product Search & Quick Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {/* Top Bar with Barcode Scanner & Search */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
            <div className="flex gap-2">
              <button
                id="pos-open-scanner-btn"
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scan Barcode</span>
              </button>

              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="pos-search-product-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama barang atau nomor barcode..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid for Fast POS Cashier Tapping */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOut = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  id={`pos-item-btn-${p.id}`}
                  type="button"
                  disabled={isOut}
                  onClick={() => handleAddToCart(p)}
                  className={`text-left bg-white rounded-xl border p-2 transition flex flex-col justify-between group shadow-2xs ${
                    isOut
                      ? 'opacity-40 bg-slate-100 cursor-not-allowed border-slate-200'
                      : 'hover:border-emerald-500 hover:shadow-xs border-slate-200/90 active:scale-98'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <img
                      src={formatImageUrl(p.photoUrl)}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-100"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight group-hover:text-emerald-700">
                        {p.name}
                      </h4>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.category}</div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-emerald-700 font-mono">
                      {formatRupiah(p.sellPrice)}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        p.stock <= p.minStock
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.stock} {p.unit || 'pcs'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout Panel (5 cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCompleteTransaction}
            className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs space-y-3 sticky top-16"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Kasir Transaksi POS</h3>
                {posCart.length > 0 && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                    {posCart.reduce((s, it) => s + it.quantity, 0)} item
                  </span>
                )}
              </div>
              {posCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPosCart([])}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {posCart.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Klik barang di sebelah kiri atau scan barcode untuk transaksi.
                </div>
              ) : (
                posCart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-slate-500 text-[10px] font-mono">
                        {formatRupiah(item.customPrice ?? item.product.sellPrice)} x {item.quantity}
                      </div>
                    </div>

                    {/* Qty button */}
                    <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                        className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-700 font-bold"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                        className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-700 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {formatRupiah((item.customPrice ?? item.product.sellPrice) * item.quantity)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-red-500 hover:text-red-700 text-[10px] font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Discount Settings */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pembeli</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Pelanggan Umum"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Diskon / Potongan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={globalDiscount || ''}
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Metode Bayar</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'cash', label: 'Tunai (Cash)' },
                    { id: 'debt_partial', label: 'Hutang DP' },
                    { id: 'debt_full', label: 'Hutang Full' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                        paymentMethod === m.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash given inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-1.5 p-2 bg-emerald-50/70 rounded-lg border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 text-xs">Uang Diterima:</span>
                    <input
                      id="pos-cash-given-input"
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder="0"
                      className="w-28 px-2 py-1 text-right font-extrabold text-xs font-mono bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Cash quick presets */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Pas', val: finalTotal },
                      { label: '20rb', val: 20000 },
                      { label: '50rb', val: 50000 },
                      { label: '100rb', val: 100000 },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGiven(btn.val)}
                        className="px-2 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-100 rounded text-[10px] font-semibold text-emerald-900 shadow-2xs font-mono"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between font-bold text-emerald-900 pt-1 border-t border-emerald-200 text-xs">
                    <span>Kembalian:</span>
                    <span className="font-mono text-sm">{formatRupiah(change)}</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'debt_partial' && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-950 text-xs">Uang Muka (DP):</span>
                    <input
                      type="number"
                      value={downPayment || ''}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      placeholder="0"
                      className="w-28 px-2 py-1 text-right font-bold text-xs font-mono bg-white border border-amber-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-red-700 text-xs font-mono">
                    <span>Sisa Hutang:</span>
                    <span>{formatRupiah(remainingDebt)}</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'debt_full' && (
                <div className="p-2 bg-red-50 rounded-lg border border-red-200 text-red-800 text-xs font-bold flex justify-between font-mono">
                  <span>Hutang Keseluruhan:</span>
                  <span>{formatRupiah(finalTotal)}</span>
                </div>
              )}
            </div>

            {/* Total calculation summary */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 font-mono">
                <span>Subtotal:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {globalDiscount > 0 && (
                <div className="flex justify-between text-red-600 font-bold font-mono">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(globalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AKHIR:</span>
                <span className="text-emerald-700 font-mono">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-1">
              <button
                id="pos-submit-checkout-btn"
                type="submit"
                disabled={posCart.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Simpan Transaksi & Cetak Struk</span>
              </button>

              {lastCompletedOrder && (
                <button
                  id="reprint-last-receipt-btn"
                  type="button"
                  onClick={() => printThermalReceipt(lastCompletedOrder, settings)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3 h-3 text-slate-600" />
                  <span>Cetak Ulang (#{lastCompletedOrder.orderNumber})</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
