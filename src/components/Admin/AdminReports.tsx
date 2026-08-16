import React, { useState, useMemo } from 'react';
import { Order, StoreSettings } from '../../types';
import { formatRupiah } from '../../lib/imageHelper';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle, 
  ArrowUpRight, 
  Printer, 
  Filter, 
  Layers 
} from 'lucide-react';

interface AdminReportsProps {
  orders: Order[];
  settings: StoreSettings;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ orders, settings }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      const orderTime = new Date(o.createdAt).getTime();

      if (period === 'today') {
        return orderTime >= startOfToday;
      } else if (period === 'week') {
        const startOfWeek = startOfToday - 7 * 86400000;
        return orderTime >= startOfWeek;
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return orderTime >= startOfMonth;
      } else if (period === 'custom') {
        const s = new Date(startDate + 'T00:00:00').getTime();
        const e = new Date(endDate + 'T23:59:59').getTime();
        return orderTime >= s && orderTime <= e;
      }
      return true;
    });
  }, [orders, period, startDate, endDate]);

  // Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + o.profit, 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + o.totalBuyCost, 0);
  const totalItemsSold = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  // Top selling products ranking
  const productSalesMap = useMemo(() => {
    const map: Record<string, { name: string; category?: string; qty: number; revenue: number; profit: number }> = {};

    filteredOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            category: item.category,
            qty: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.subtotal;
        map[item.productId].profit += (item.sellPrice - item.buyPrice) * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Header & Date Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Laporan & Analisis Penjualan</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Analisis omset kotor, laba bersih transaksi, dan statistik barang paling laris.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>

        {/* Time Preset Buttons & Custom Date */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3 text-slate-400" /> Periode:
          </span>

          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'custom', label: 'Rentang Tanggal' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as typeof period)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                period === item.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
              <span className="text-slate-400 text-xs">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Total Omset Penjualan</div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-0.5 font-mono font-medium">
            <ArrowUpRight className="w-2.5 h-2.5" />
            <span>{filteredOrders.length} Transaksi</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="text-[10px] text-emerald-800 font-bold uppercase">Total Laba Bersih</div>
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5 font-mono">
            {formatRupiah(totalProfit)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Margin:{' '}
            <b className="font-mono font-extrabold text-slate-700">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </b>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Modal Pokok (HPP)</div>
          <div className="text-base sm:text-lg font-extrabold text-slate-700 mt-0.5 font-mono">
            {formatRupiah(totalCost)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Harga modal barang</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Volume Terjual</div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
            {totalItemsSold} <span className="text-xs font-normal text-slate-500">Unit</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total kuantitas item</div>
        </div>
      </div>

      {/* Top Products Sales Ranking */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Peringkat Penjualan Produk Terlaris</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase text-[9px] font-mono tracking-wider">
              <tr>
                <th className="py-2 px-2.5">No</th>
                <th className="py-2 px-2.5">Nama Produk</th>
                <th className="py-2 px-2.5 text-center">Terjual</th>
                <th className="py-2 px-2.5 text-right">Total Omset</th>
                <th className="py-2 px-2.5 text-right">Kontribusi Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productSalesMap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    Belum ada data barang terjual pada periode ini.
                  </td>
                </tr>
              ) : (
                productSalesMap.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-2.5 font-bold text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-bold text-slate-900 text-xs">{item.name}</td>
                    <td className="py-2 px-2.5 text-center font-extrabold text-slate-800 font-mono text-xs">
                      {item.qty}
                    </td>
                    <td className="py-2 px-2.5 text-right font-medium text-slate-700 font-mono text-xs">
                      {formatRupiah(item.revenue)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700 font-mono text-xs">
                      +{formatRupiah(item.profit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
