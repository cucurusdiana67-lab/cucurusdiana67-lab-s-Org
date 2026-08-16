import React, { useState, useEffect } from 'react';
import { CartItem, StoreSettings, User, Order } from '../types';
import { formatImageUrl, formatRupiah } from '../lib/imageHelper';
import { storage } from '../lib/storage';
import { copyOrderToWhatsApp } from '../lib/receiptPrinter';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  CheckCircle, 
  CreditCard, 
  Truck, 
  Phone, 
  MapPin, 
  Wallet,
  LogIn,
  Copy,
  MessageSquare,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartPageProps {
  cart: CartItem[];
  settings: StoreSettings;
  currentUser: User | null;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onBackToShop: () => void;
  onOrderCompleted: (order: Order) => void;
  onRequestLogin?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  settings,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBackToShop,
  onOrderCompleted,
  onRequestLogin,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'dana'>('cod');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(currentUser?.address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedWa, setCopiedWa] = useState(false);

  // Sync with current user profile whenever logged in user changes
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerPhone(currentUser.phone || '');
      setCustomerAddress(currentUser.address || '');
    }
  }, [currentUser]);

  const isWholesale = currentUser?.customerType === 'wholesale';

  const getItemUnitPrice = (item: CartItem) => {
    if (item.customPrice !== undefined) return item.customPrice;
    if (isWholesale && item.product.wholesalePrice > 0) return item.product.wholesalePrice;
    return item.product.sellPrice;
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
  const totalBuyCost = cart.reduce((sum, item) => sum + item.product.buyPrice * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const profit = subtotal - totalBuyCost;

  const handleCopyWa = async (ord: Order) => {
    const ok = await copyOrderToWhatsApp(ord, settings);
    if (ok) {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!currentUser) {
      if (onRequestLogin) onRequestLogin();
      return;
    }

    if (!customerName.trim() || !customerAddress.trim()) {
      alert('Mohon lengkapi Nama dan Alamat Pengiriman!');
      return;
    }

    setIsSubmitting(true);

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      type: 'online',
      customerId: currentUser?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: cart.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        return {
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          category: item.product.category,
          buyPrice: item.product.buyPrice,
          sellPrice: unitPrice,
          quantity: item.quantity,
          subtotal: unitPrice * item.quantity,
        };
      }),
      subtotal,
      totalDiscount: 0,
      totalAmount: subtotal,
      totalBuyCost,
      profit,
      paymentMethod,
      amountPaid: subtotal,
      remainingDebt: 0,
      status: 'pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save order & deduct stock
    storage.createOrder(newOrder);
    onClearCart();
    setCompletedOrder(newOrder);
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onOrderCompleted(newOrder);
  };

  if (completedOrder) {
    const rawPhone = settings.storePhone.replace(/[^0-9]/g, '');
    const storeWaNumber = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;

    return (
      <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pesanan Berhasil Dibuat!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Nomor Pesanan: <span className="font-mono font-bold text-slate-800">#{completedOrder.orderNumber}</span>
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left text-xs space-y-2 border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500">Penerima:</span>
            <span className="font-semibold text-slate-800">{completedOrder.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Metode Bayar:</span>
            <span className="font-semibold text-emerald-700 uppercase">
              {completedOrder.paymentMethod === 'cod' ? 'Bayar di Tempat (COD)' : 'Bayar via DANA'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Tagihan:</span>
            <span className="font-bold text-slate-900 text-sm">{formatRupiah(completedOrder.totalAmount)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 text-slate-600">
            <span>Alamat Kirim: </span>
            <span className="font-medium">{completedOrder.customerAddress}</span>
          </div>
        </div>

        {/* WhatsApp Receipt Copy Action */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Salin Bukti Pesanan Format WhatsApp:</span>
            </div>
            {copiedWa && (
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Berhasil Disalin!
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-800">
            Salin teks struk pembelian untuk dikirimkan ke WhatsApp toko atau disimpan sebagai bukti.
          </p>
          <div className="flex gap-2">
            <button
              id="copy-wa-receipt-btn"
              type="button"
              onClick={() => handleCopyWa(completedOrder)}
              className="flex-1 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
            >
              {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{copiedWa ? 'Tersalin di Clipboard' : 'Salin Format WhatsApp'}</span>
            </button>

            {storeWaNumber && (
              <a
                id="send-wa-direct-btn"
                href={`https://wa.me/${storeWaNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Buka WhatsApp Toko</span>
              </a>
            )}
          </div>
        </div>

        {completedOrder.paymentMethod === 'dana' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Wallet className="w-4 h-4 text-blue-600" />
              Petunjuk Pembayaran DANA:
            </div>
            <p className="text-blue-800">
              Silakan transfer sebesar <b>{formatRupiah(completedOrder.totalAmount)}</b> ke nomor DANA toko:
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 font-mono font-bold text-blue-950 text-center text-sm">
              {settings.danaNumber} (a.n {settings.danaHolder})
            </div>
            <p className="text-[11px] text-blue-700">
              Konfirmasi bukti transfer ke WhatsApp toko di <b>{settings.storePhone}</b>.
            </p>
          </div>
        )}

        <button
          id="finish-order-btn"
          type="button"
          onClick={onBackToShop}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
        >
          Kembali Belanja
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Keranjang Masih Kosong</h3>
        <p className="text-xs text-slate-500">
          Anda belum memilih barang belanjaan. Silakan pilih produk dari katalog toko.
        </p>
        <button
          id="empty-cart-back-btn"
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Mulai Belanja Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <button
          id="cart-back-btn"
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog</span>
        </button>
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span>Keranjang Belanja</span>
          <span className="text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
            {totalItemsCount} item
          </span>
        </h2>
        <button
          id="clear-cart-btn"
          type="button"
          onClick={onClearCart}
          className="text-xs text-red-600 hover:text-red-700 font-bold"
        >
          Kosongkan
        </button>
      </div>

      {/* Guest Warning: Must login as customer to order */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-2.5">
            <LogIn className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-xs sm:text-sm">Wajib Masuk / Daftar Akun Pengguna</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Untuk melakukan pemesanan, silakan login ke akun pelanggan Anda agar alamat pengiriman dan no. WhatsApp terisi otomatis.
              </p>
            </div>
          </div>
          <button
            id="cart-login-prompt-btn"
            type="button"
            onClick={onRequestLogin}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs transition shrink-0"
          >
            Masuk / Daftar Akun
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-7 space-y-2">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-xl border border-slate-200/90 p-2.5 flex items-center gap-2.5 shadow-2xs hover:border-slate-300 transition"
            >
              {/* Product Photo */}
              <img
                src={formatImageUrl(item.product.photoUrl)}
                alt={item.product.name}
                className="w-13 h-13 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-100"
                loading="lazy"
                referrerPolicy="no-referrer"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                    {item.product.category}
                  </span>
                  {isWholesale && item.product.wholesalePrice > 0 && (
                    <span className="text-[8.5px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                      Borongan
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">
                  {item.product.name}
                </h4>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatRupiah(getItemUnitPrice(item))} / {item.product.unit || 'pcs'}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 text-slate-600 hover:bg-slate-200 active:scale-95 transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-extrabold font-mono text-slate-800">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 active:scale-95 transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Subtotal & Delete */}
              <div className="text-right shrink-0">
                <div className="text-xs font-extrabold font-mono text-slate-900">
                  {formatRupiah(getItemUnitPrice(item) * item.quantity)}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-slate-400 hover:text-red-600 p-0.5 transition"
                  title="Hapus dari keranjang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Checkout & Payment Section */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCheckout}
            className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs sticky top-20"
          >
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Informasi Pengiriman & Checkout
                </h3>
                {currentUser && (
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Data terisi otomatis dari akun: {currentUser.name}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                COD / DANA
              </span>
            </div>

            {/* Customer Details */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Pemesan *</label>
                <input
                  id="checkout-name-input"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="checkout-phone-input"
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat Pengiriman *</label>
                <div className="relative">
                  <MapPin className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                  <textarea
                    id="checkout-address-input"
                    rows={2}
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Jl. Mawar No. 12, RT 01/02..."
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Catatan Tambahan (Opsional)</label>
                <input
                  id="checkout-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titip di pos satpam"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-700">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  id="pay-cod-btn"
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col justify-between gap-1 ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-extrabold">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    COD (Tunai)
                  </div>
                  <span className="text-[9px] text-slate-500">Bayar di Tempat saat barang tiba</span>
                </button>

                <button
                  id="pay-dana-btn"
                  type="button"
                  onClick={() => setPaymentMethod('dana')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col justify-between gap-1 ${
                    paymentMethod === 'dana'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-extrabold">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    DANA / QRIS
                  </div>
                  <span className="text-[9px] text-slate-500">Transfer e-wallet DANA</span>
                </button>
              </div>

              {paymentMethod === 'dana' && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs space-y-0.5 mt-1.5">
                  <div className="text-blue-900 font-bold text-[11px]">Akun DANA Toko:</div>
                  <div className="font-mono font-extrabold text-blue-950 text-xs">
                    {settings.danaNumber} (a.n {settings.danaHolder})
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Subtotal Barang:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Ongkos Kirim:</span>
                <span className="text-emerald-600 font-bold">GRATIS</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Bayar:</span>
                <span className="text-emerald-700">{formatRupiah(subtotal)}</span>
              </div>
            </div>

            {/* Order Submit Button */}
            {currentUser ? (
              <button
                id="submit-order-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-2xs transition flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi Pesanan Sekarang'}</span>
              </button>
            ) : (
              <button
                id="login-first-btn"
                type="button"
                onClick={onRequestLogin}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-2xs transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun Pengguna untuk Pesan</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

