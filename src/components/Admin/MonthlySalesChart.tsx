import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Order } from '../../types';
import { formatRupiah } from '../../lib/imageHelper';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface MonthlySalesChartProps {
  orders: Order[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORTS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

// Short formatting for chart Y-axis (e.g., 1.5 Jt, 500 Rb)
const formatShortRupiah = (val: number): string => {
  if (!val || val === 0) return '0';
  if (val >= 1_000_000_000) {
    const formatted = (val / 1_000_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted} M`;
  }
  if (val >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted} Jt`;
  }
  if (val >= 1_000) {
    return `${Math.round(val / 1_000)} Rb`;
  }
  return String(val);
};

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ orders }) => {
  const currentYear = new Date().getFullYear();

  // Extract available years from orders
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);

    orders.forEach((o) => {
      if (o.status !== 'cancelled' && o.createdAt) {
        const y = new Date(o.createdAt).getFullYear();
        if (!isNaN(y) && y > 2000) {
          yearsSet.add(y);
        }
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number | 'last12'>(currentYear);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [metricView, setMetricView] = useState<'both' | 'revenue' | 'profit'>('both');

  // Compute monthly data for the selected period
  const monthlyData = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');

    if (selectedYear === 'last12') {
      // Last 12 consecutive months ending at the current month
      const list: Array<{
        monthKey: string;
        month: string;
        monthShort: string;
        year: number;
        revenue: number;
        profit: number;
        cost: number;
        orderCount: number;
        itemsSold: number;
      }> = [];

      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        list.push({
          monthKey: `${y}-${m}`,
          month: `${MONTH_NAMES[m]} ${y}`,
          monthShort: `${MONTH_SHORTS[m]} '${String(y).slice(-2)}`,
          year: y,
          revenue: 0,
          profit: 0,
          cost: 0,
          orderCount: 0,
          itemsSold: 0,
        });
      }

      validOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const y = d.getFullYear();
        const m = d.getMonth();
        const target = list.find((item) => item.monthKey === `${y}-${m}`);
        if (target) {
          target.revenue += o.totalAmount || 0;
          target.profit += o.profit || 0;
          target.cost += o.totalBuyCost || 0;
          target.orderCount += 1;
          target.itemsSold += (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
        }
      });

      return list;
    }

    // Specific calendar year (12 months: Jan - Des)
    const list = MONTH_NAMES.map((name, index) => ({
      monthKey: `${selectedYear}-${index}`,
      month: name,
      monthShort: MONTH_SHORTS[index],
      year: selectedYear,
      revenue: 0,
      profit: 0,
      cost: 0,
      orderCount: 0,
      itemsSold: 0,
    }));

    validOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (list[m]) {
          list[m].revenue += o.totalAmount || 0;
          list[m].profit += o.profit || 0;
          list[m].cost += o.totalBuyCost || 0;
          list[m].orderCount += 1;
          list[m].itemsSold += (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
        }
      }
    });

    return list;
  }, [orders, selectedYear]);

  // Aggregate statistics for the selected year
  const stats = useMemo(() => {
    const totalRev = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const totalProf = monthlyData.reduce((sum, item) => sum + item.profit, 0);
    const totalOrders = monthlyData.reduce((sum, item) => sum + item.orderCount, 0);

    // Active months with revenue
    const activeMonths = monthlyData.filter((item) => item.revenue > 0);
    const avgMonthly = activeMonths.length > 0 ? totalRev / activeMonths.length : totalRev / 12;

    // Peak Month
    let peakMonth = monthlyData[0];
    monthlyData.forEach((item) => {
      if (item.revenue > (peakMonth?.revenue || 0)) {
        peakMonth = item;
      }
    });

    return {
      totalRev,
      totalProf,
      totalOrders,
      avgMonthly,
      peakMonth: peakMonth && peakMonth.revenue > 0 ? peakMonth : null,
      marginPercent: totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : '0',
    };
  }, [monthlyData]);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0';

      return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[200px] z-50">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
            <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data.month}</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
              {data.orderCount} Transaksi
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Total Omset:
              </span>
              <span className="font-mono font-bold text-white text-xs">
                {formatRupiah(data.revenue)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                Laba Bersih:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                +{formatRupiah(data.profit)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              <span>Margin Keuntungan:</span>
              <span className="font-mono font-bold text-emerald-300">{margin}%</span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Volume Item Terjual:</span>
              <span className="font-mono text-slate-300">{data.itemsSold} Unit</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Grafik Total Penjualan Bulanan
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pantau pergerakan omset, laba kotor, dan performa penjualan sepanjang bulan.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedYear}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedYear(val === 'last12' ? 'last12' : Number(val));
              }}
              className="bg-transparent text-xs font-bold text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
            >
              <option value="last12">12 Bulan Terakhir</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] ${
                metricView === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setMetricView('revenue')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] ${
                metricView === 'revenue'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omset
            </button>
            <button
              type="button"
              onClick={() => setMetricView('profit')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] ${
                metricView === 'profit'
                  ? 'bg-white text-teal-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Laba
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Grafik Batang (Bar Chart)"
              className={`px-2 py-1 rounded-md transition text-[11px] flex items-center gap-1 ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Batang</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Grafik Area / Tren Garis"
              className={`px-2 py-1 rounded-md transition text-[11px] flex items-center gap-1 ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tren</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Performance Highlights for Selected Period */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Omset Periode Ini
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
            {formatRupiah(stats.totalRev)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
            Laba Bersih ({stats.marginPercent}%)
          </span>
          <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm mt-0.5 block">
            {formatRupiah(stats.totalProf)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Rata-rata / Bulan
          </span>
          <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">
            {formatRupiah(stats.avgMonthly)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Bulan Puncak
          </span>
          {stats.peakMonth ? (
            <div className="mt-0.5 truncate">
              <span className="font-bold text-slate-900 text-xs block truncate">
                {stats.peakMonth.month}
              </span>
              <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                {formatRupiah(stats.peakMonth.revenue)}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs mt-0.5 block">-</span>
          )}
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      <div className="w-full pt-1" style={{ minHeight: '320px' }}>
        {stats.totalRev === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="p-3 bg-white rounded-full shadow-2xs text-slate-400 mb-2 border border-slate-200">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Belum Ada Data Penjualan di Periode {selectedYear === 'last12' ? '12 Bulan Terakhir' : `Tahun ${selectedYear}`}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              Setiap kali transaksi baru diselesaikan melalui Kasir (POS) atau Pesanan, grafik tren penjualan bulanan akan langsung ter-update secara otomatis di sini.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'bar' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tickFormatter={formatShortRupiah}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: '11px',
                    paddingBottom: '12px',
                    fontWeight: 600,
                  }}
                />

                {(metricView === 'both' || metricView === 'revenue') && (
                  <Bar
                    dataKey="revenue"
                    name="Total Omset"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                )}

                {(metricView === 'both' || metricView === 'profit') && (
                  <Bar
                    dataKey="profit"
                    name="Laba Bersih"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                )}
              </BarChart>
            ) : (
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tickFormatter={formatShortRupiah}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: '11px',
                    paddingBottom: '12px',
                    fontWeight: 600,
                  }}
                />

                {(metricView === 'both' || metricView === 'revenue') && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Total Omset"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                )}

                {(metricView === 'both' || metricView === 'profit') && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Laba Bersih"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer with Insight Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Grafik ter-update otomatis secara realtime saat terjadi transaksi kasir.</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          Total {stats.totalOrders} transaksi terdaftar
        </span>
      </div>
    </div>
  );
};
