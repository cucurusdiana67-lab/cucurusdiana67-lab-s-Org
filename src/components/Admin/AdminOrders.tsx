import React, { useState } from 'react';
import { Order, StoreSettings, OrderStatus } from '../../types';
import { storage } from '../../lib/storage';
import { formatRupiah } from '../../lib/imageHelper';
import { printThermalReceipt } from '../../lib/receiptPrinter';
import { 
  FileText, 
  Search, 
  Printer, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  MapPin, 
  Calendar,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  settings: StoreSettings;
  onRefreshOrders: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  settings,
  onRefreshOrders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteOrder = () => {
    if (!orderToDelete) return;
    const ordNum = orderToDelete.orderNumber;
    storage.deleteOrder(orderToDelete.id, restoreStockOnDelete);
    onRefreshOrders();
    setOrderToDelete(null);
    showToast(`Pesanan #${ordNum} berhasil dihapus.`);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchType = typeFilter === 'all' || ord.type === typeFilter;
    const matchSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.customerPhone && ord.customerPhone.includes(searchQuery));
    return matchStatus && matchType && matchSearch;
  });

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    storage.updateOrderStatus(orderId, newStatus);
    onRefreshOrders();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Menunggu
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Truck className="w-3 h-3" /> Diproses
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Riwayat & Status Pesanan</span>
            <span className="text-[11px] font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {orders.length} Transaksi
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kelola status proses pesanan online pelanggan, cetak struk thermal, dan rekap profit per transaksi.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-orders-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor pesanan, nama pembeli, atau nomor WhatsApp..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
          />
        </div>

        {/* Filter by Type & Status */}
        <div className="flex gap-2">
          <select
            id="filter-order-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Channel</option>
            <option value="online">Online App</option>
            <option value="pos">Kasir POS</option>
          </select>

          <select
            id="filter-order-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="processing">Diproses</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada pesanan yang sesuai dengan filter.
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const formattedDate = new Date(ord.createdAt).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs transition hover:border-emerald-500/60"
              >
                {/* Main Row Summary */}
                <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ord.type === 'online'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {ord.type === 'online' ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs font-mono">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                            ord.type === 'online'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.type === 'online' ? 'Online' : 'POS'}
                        </span>
                        {getStatusBadge(ord.status)}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2.5 flex-wrap">
                        <span>Penerima: <b className="text-slate-800">{ord.customerName}</b></span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {formattedDate}
                        </span>
                        <span className="text-slate-400">({ord.items.length} item)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total & Action buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 pt-1.5 md:pt-0 border-t md:border-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                      <div className="text-sm font-extrabold text-emerald-700 font-mono">
                        {formatRupiah(ord.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => printThermalReceipt(ord, settings)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-bold flex items-center gap-1 transition"
                        title="Cetak Struk Thermal"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span className="hidden sm:inline">Struk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                        className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition"
                        title="Lihat Detail Pesanan"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        id={`delete-order-${ord.id}-btn`}
                        onClick={() => {
                          setOrderToDelete(ord);
                          setRestoreStockOnDelete(true);
                        }}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition border border-red-200"
                        title="Hapus Pesanan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                    {/* Items table */}
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-1">
                      <div className="font-bold text-slate-800 text-[11px] mb-1">Rincian Barang:</div>
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{item.productName}</span>
                            <span className="text-slate-400 text-[10px] font-mono ml-2">
                              ({item.quantity} x {formatRupiah(item.sellPrice)})
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-800 font-mono text-xs">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Customer details & address if online */}
                    {ord.type === 'online' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 text-xs">
                        {ord.customerPhone && (
                          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-md border border-slate-200">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WA: <b className="font-mono">{ord.customerPhone}</b></span>
                          </div>
                        )}
                        {ord.customerAddress && (
                          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-md border border-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate">Alamat: <b>{ord.customerAddress}</b></span>
                          </div>
                        )}
                      </div>
                    )}

                    {ord.notes && (
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-md text-amber-900 text-xs">
                        <b>Catatan:</b> {ord.notes}
                      </div>
                    )}

                    {/* Change Status Controls */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-600 text-[11px]">Ubah Status:</span>
                        <div className="flex gap-1 flex-wrap">
                          {(['pending', 'processing', 'completed', 'cancelled'] as OrderStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStatus(ord.id, st)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition ${
                                  ord.status === st
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {st === 'pending'
                                  ? 'Menunggu'
                                  : st === 'processing'
                                  ? 'Diproses'
                                  : st === 'completed'
                                  ? 'Selesai'
                                  : 'Batal'}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="text-slate-500 text-[11px] font-mono">
                        Laba: <b className="text-emerald-700">+{formatRupiah(ord.profit)}</b>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Confirmation Delete Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Pesanan #{orderToDelete.orderNumber}?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pesanan atas nama <span className="font-bold text-slate-800">{orderToDelete.customerName}</span> total <span className="font-bold text-emerald-700 font-mono">{formatRupiah(orderToDelete.totalAmount)}</span> akan dihapus dari riwayat transaksi.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-left text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Tipe Transaksi:</span>
                  <span className="font-bold uppercase text-slate-800">{orderToDelete.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Produk:</span>
                  <span className="font-mono font-bold text-slate-800">{orderToDelete.items.reduce((s, i) => s + i.quantity, 0)} item</span>
                </div>

                <label className="flex items-center gap-2 pt-1 border-t border-slate-200 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={restoreStockOnDelete}
                    onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] font-medium flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    Kembalikan stok produk ke etalase
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  id="confirm-delete-order-btn"
                  onClick={handleDeleteOrder}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  Ya, Hapus Pesanan
                </button>
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
