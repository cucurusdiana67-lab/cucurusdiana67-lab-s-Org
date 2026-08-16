import React, { useState, useEffect } from 'react';
import { Product, Order, StoreSettings, CartItem, PaymentMethod, User, CustomerType } from '../../types';
import { storage } from '../../lib/storage';
import { formatImageUrl, formatRupiah } from '../../lib/imageHelper';
import { printThermalReceipt, copyOrderToWhatsApp } from '../../lib/receiptPrinter';
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
  ShoppingBag,
  History,
  Edit3,
  Copy,
  MessageSquare,
  Check,
  Calendar,
  X,
  PackageCheck,
  Phone,
  Tag
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
  
  // Buyer & Pricing Type state
  const [customerType, setCustomerType] = useState<CustomerType>('general');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [registeredCustomers, setRegisteredCustomers] = useState<User[]>(() => 
    storage.getUsers().filter((u) => u.role === 'customer')
  );

  // Checkout POS state
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Sales History List state
  const [recentOrders, setRecentOrders] = useState<Order[]>(() => 
    storage.getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [historySearch, setHistorySearch] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('cash');
  const [editStatus, setEditStatus] = useState<'pending' | 'processing' | 'completed' | 'cancelled'>('completed');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirmation State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true);

  // Refresh customer list if changed
  useEffect(() => {
    setRegisteredCustomers(storage.getUsers().filter((u) => u.role === 'customer'));
  }, []);

  const refreshOrders = () => {
    const list = storage.getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecentOrders(list);
    setRegisteredCustomers(storage.getUsers().filter((u) => u.role === 'customer'));
  };

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper to determine price based on customer type
  const getProductPrice = (product: Product, type: CustomerType) => {
    if (type === 'wholesale' && product.wholesalePrice > 0) {
      return product.wholesalePrice;
    }
    return product.sellPrice;
  };

  // Switch customer type and update all cart items' prices
  const handleCustomerTypeChange = (newType: CustomerType) => {
    setCustomerType(newType);
    setPosCart((prev) =>
      prev.map((item) => ({
        ...item,
        customPrice: getProductPrice(item.product, newType),
      }))
    );
  };

  // Handle selecting a registered customer
  const handleSelectRegisteredCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerName('Pelanggan Umum');
      setCustomerPhone('');
      handleCustomerTypeChange('general');
      return;
    }

    const cust = registeredCustomers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
      const type = cust.customerType === 'wholesale' ? 'wholesale' : 'general';
      handleCustomerTypeChange(type);
    }
  };

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
  const subtotal = posCart.reduce((sum, item) => sum + (item.customPrice ?? getProductPrice(item.product, customerType)) * item.quantity, 0);
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

    const itemPrice = getProductPrice(product, customerType);

    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok tidak mencukupi (tersedia: ${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1, customPrice: itemPrice } : item
        );
      }
      return [...prev, { product, quantity: 1, customPrice: itemPrice }];
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
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone.trim(),
      items: posCart.map((item) => {
        const itemPrice = item.customPrice ?? getProductPrice(item.product, customerType);
        return {
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          category: item.product.category,
          buyPrice: item.product.buyPrice,
          sellPrice: itemPrice,
          quantity: item.quantity,
          subtotal: itemPrice * item.quantity,
        };
      }),
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
    refreshOrders();
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
    setSelectedCustomerId('');
    setCustomerType('general');

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // WhatsApp Copy Handler
  const handleCopyOrderWhatsApp = async (order: Order) => {
    const success = await copyOrderToWhatsApp(order, settings);
    if (success) {
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2500);
    }
  };

  // Open Edit Order
  const handleOpenEditOrder = (ord: Order) => {
    setEditingOrder(ord);
    setEditCustomerName(ord.customerName);
    setEditCustomerPhone(ord.customerPhone || '');
    setEditPaymentMethod(ord.paymentMethod);
    setEditStatus(ord.status);
    setEditNotes(ord.notes || '');
  };

  const handleSaveEditedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const updated: Order = {
      ...editingOrder,
      customerName: editCustomerName.trim() || 'Pelanggan Umum',
      customerPhone: editCustomerPhone.trim() || undefined,
      paymentMethod: editPaymentMethod,
      status: editStatus,
      notes: editNotes.trim() || undefined,
    };

    storage.updateOrder(updated);
    refreshOrders();
    setEditingOrder(null);
  };

  // Delete Order
  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    storage.deleteOrder(orderToDelete.id, restoreStockOnDelete);
    onRefreshProducts();
    refreshOrders();
    setOrderToDelete(null);
  };

  // Filtered History
  const filteredHistory = recentOrders.filter((ord) => {
    const q = historySearch.toLowerCase();
    const matchInv = ord.orderNumber.toLowerCase().includes(q);
    const matchCust = ord.customerName.toLowerCase().includes(q);
    const matchItems = ord.items.some((it) => it.productName.toLowerCase().includes(q));
    return matchInv || matchCust || matchItems;
  });

  return (
    <div className="space-y-4 pb-16">
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
              const activePrice = getProductPrice(p, customerType);
              const isWholesaleActive = customerType === 'wholesale';
              const hasWholesaleDiscount = isWholesaleActive && p.wholesalePrice > 0 && p.wholesalePrice < p.sellPrice;
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
                      : isWholesaleActive
                      ? 'hover:border-blue-500 hover:shadow-xs border-slate-200/90 active:scale-98'
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
                      <div className="flex items-center gap-1 mt-0.5 truncate">
                        <span className="text-[10px] text-slate-400">{p.category}</span>
                        {isWholesaleActive && p.wholesalePrice > 0 && (
                          <span className="text-[8.5px] font-extrabold bg-blue-100 text-blue-800 px-1 py-0.1 rounded">
                            Borongan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div>
                      <span className={`font-bold text-xs font-mono ${isWholesaleActive ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {formatRupiah(activePrice)}
                      </span>
                      {hasWholesaleDiscount && (
                        <div className="text-[9px] text-slate-400 font-mono line-through">
                          {formatRupiah(p.sellPrice)}
                        </div>
                      )}
                    </div>
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

            {/* Buyer Type & Customer Selection Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jenis Pembeli & Harga:</span>
                </label>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  customerType === 'wholesale'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {customerType === 'wholesale' ? 'Harga Borongan' : 'Harga Jual Umum'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  id="pos-buyer-type-general"
                  type="button"
                  onClick={() => handleCustomerTypeChange('general')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    customerType === 'general'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Umum (Harga Jual)</span>
                </button>

                <button
                  id="pos-buyer-type-wholesale"
                  type="button"
                  onClick={() => handleCustomerTypeChange('wholesale')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    customerType === 'wholesale'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Borongan (Harga Borongan)</span>
                </button>
              </div>

              {/* Select from registered customers */}
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                  Pilih Pelanggan Terdaftar (Opsional):
                </label>
                <select
                  id="pos-customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectRegisteredCustomer(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Pelanggan Bebas / Non-Member --</option>
                  {registeredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerType === 'wholesale' ? 'Borongan' : 'Umum'}) {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {posCart.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Klik barang di sebelah kiri atau scan barcode untuk transaksi.
                </div>
              ) : (
                posCart.map((item) => {
                  const itemPrice = item.customPrice ?? getProductPrice(item.product, customerType);
                  return (
                    <div
                      key={item.product.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                          <span>{item.product.name}</span>
                          {customerType === 'wholesale' && item.product.wholesalePrice > 0 && (
                            <span className="text-[8.5px] font-bold bg-blue-100 text-blue-800 px-1 py-0.2 rounded">
                              Borongan
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[10px] font-mono">
                          {formatRupiah(itemPrice)} x {item.quantity}
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
                          {formatRupiah(itemPrice * item.quantity)}
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
                  );
                })
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">No. HP / WA Pembeli</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Diskon / Potongan Transaksi (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={globalDiscount || ''}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-emerald-500"
                />
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
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    id="reprint-last-receipt-btn"
                    type="button"
                    onClick={() => printThermalReceipt(lastCompletedOrder, settings)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3 h-3 text-slate-600" />
                    <span>Cetak Struk</span>
                  </button>

                  <button
                    id="copy-last-wa-btn"
                    type="button"
                    onClick={() => handleCopyOrderWhatsApp(lastCompletedOrder)}
                    className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md text-xs flex items-center justify-center gap-1.5 transition border border-emerald-200"
                  >
                    {copiedOrderId === lastCompletedOrder.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Salin Format WA</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAFTAR BARANG YANG PERNAH DIJUAL / RIWAYAT TRANSAKSI KASIR (Paling Baru Diatas) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>Daftar Barang Terjual & Riwayat Transaksi Kasir</span>
                <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  {recentOrders.length} Transaksi
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Urutan transaksi paling baru di atas. Dilengkapi fitur edit, hapus (kembalikan stok), dan salin bukti format WhatsApp.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari faktur, pembeli, atau barang..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Clean, Neat Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                <th className="p-3 whitespace-nowrap">Waktu & No. Faktur</th>
                <th className="p-3">Pembeli</th>
                <th className="p-3 min-w-[220px]">Daftar Barang Terjual</th>
                <th className="p-3 whitespace-nowrap">Metode Bayar</th>
                <th className="p-3 text-right whitespace-nowrap">Total Tagihan</th>
                <th className="p-3 text-right whitespace-nowrap">Aksi Lengkap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat transaksi penjualan.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((ord) => {
                  const dateStr = new Date(ord.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      {/* Date & Invoice */}
                      <td className="p-3 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1">
                          <span>#{ord.orderNumber}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              ord.type === 'pos'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {ord.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{dateStr} {timeStr}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[140px]">
                          {ord.customerName}
                        </div>
                        {ord.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{ord.customerPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Sold Items list */}
                      <td className="p-3 align-top">
                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs gap-2">
                              <span className="font-medium text-slate-800 truncate max-w-[180px]">
                                • {it.productName}
                              </span>
                              <span className="font-mono text-slate-500 shrink-0 text-[11px]">
                                {it.quantity}x @ {formatRupiah(it.sellPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {ord.notes && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 italic inline-block">
                            Catatan: {ord.notes}
                          </div>
                        )}
                      </td>

                      {/* Payment Method & Status */}
                      <td className="p-3 whitespace-nowrap align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            ord.paymentMethod === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.paymentMethod === 'dana'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.paymentMethod === 'debt_partial'
                              ? 'bg-amber-100 text-amber-900'
                              : ord.paymentMethod === 'debt_full'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ord.paymentMethod === 'cash'
                            ? 'Tunai (Cash)'
                            : ord.paymentMethod === 'dana'
                            ? 'DANA / QRIS'
                            : ord.paymentMethod === 'debt_partial'
                            ? 'Hutang DP'
                            : ord.paymentMethod === 'debt_full'
                            ? 'Hutang Full'
                            : ord.paymentMethod.toUpperCase()}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              ord.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ord.status === 'cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ord.status === 'completed' ? 'Selesai' : ord.status === 'cancelled' ? 'Batal' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-3 text-right whitespace-nowrap align-top">
                        <div className="font-extrabold font-mono text-slate-900 text-xs">
                          {formatRupiah(ord.totalAmount)}
                        </div>
                        {ord.profit !== undefined && (
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            Laba: +{formatRupiah(ord.profit)}
                          </div>
                        )}
                      </td>

                      {/* Actions (Thermal, WA Copy, Edit, Delete) */}
                      <td className="p-3 text-right whitespace-nowrap align-top">
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp Copy button */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrderWhatsApp(ord)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition"
                            title="Salin Struk Format WhatsApp"
                          >
                            {copiedOrderId === ord.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Print Receipt */}
                          <button
                            type="button"
                            onClick={() => printThermalReceipt(ord, settings)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                            title="Cetak Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditOrder(ord)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded-md transition"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(ord)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-400 rounded-md transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL EDIT TRANSAKSI */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Edit Transaksi #{editingOrder.orderNumber}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Perbarui nama pembeli, status, atau catatan pesanan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedOrder} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Pembeli</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp Pembeli</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Metode Bayar</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="dana">DANA / QRIS</option>
                    <option value="cod">COD</option>
                    <option value="debt_partial">Hutang DP</option>
                    <option value="debt_full">Hutang Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Status Transaksi</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="completed">Selesai (Completed)</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Diproses</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan pesanan..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(editingOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Jumlah Item:</span>
                  <span>{editingOrder.items.reduce((s, it) => s + it.quantity, 0)} item</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HAPUS TRANSAKSI & RESTORE STOK */}
      {/* ========================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Hapus Transaksi #{orderToDelete.orderNumber}?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transaksi senilai <b>{formatRupiah(orderToDelete.totalAmount)}</b> oleh <b>{orderToDelete.customerName}</b> akan dihapus permanen.
                </p>
              </div>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreStockOnDelete}
                  onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Kembalikan stok barang yang terjual otomatis ke inventaris
                </span>
              </label>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleConfirmDeleteOrder}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
