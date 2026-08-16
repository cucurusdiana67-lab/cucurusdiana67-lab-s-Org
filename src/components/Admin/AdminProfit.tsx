import React, { useState } from 'react';
import { Order, ExternalProfitRecord } from '../../types';
import { storage } from '../../lib/storage';
import { formatRupiah } from '../../lib/imageHelper';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Calendar, 
  Tag 
} from 'lucide-react';

interface AdminProfitProps {
  orders: Order[];
  profits: ExternalProfitRecord[];
  onRefreshProfits: () => void;
}

export const AdminProfit: React.FC<AdminProfitProps> = ({
  orders,
  profits,
  onRefreshProfits,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Lain-lain');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // App sales profit (excluding cancelled)
  const appSalesProfit = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.profit, 0);

  // External income
  const externalIncome = profits
    .filter((p) => p.type === 'income')
    .reduce((sum, p) => sum + p.amount, 0);

  // External expenses
  const externalExpense = profits
    .filter((p) => p.type === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);

  // Total Consolidated Net Profit
  const grandNetProfit = appSalesProfit + externalIncome - externalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('Judul dan jumlah nominal wajib diisi!');
      return;
    }

    const newRecord: ExternalProfitRecord = {
      id: 'prof-' + Date.now(),
      title: title.trim(),
      type,
      amount: Number(amount),
      category: category.trim() || 'Lain-lain',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    storage.createProfitRecord(newRecord);
    onRefreshProfits();
    setIsModalOpen(false);

    // Reset form
    setTitle('');
    setAmount(0);
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus catatan laba/biaya ini?')) {
      storage.deleteProfitRecord(id);
      onRefreshProfits();
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Perhitungan Laba & Pencatatan Laba Luar Aplikasi</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kombinasi keuntungan dari penjualan aplikasi + input pemasukan & pengeluaran tambahan di luar aplikasi.
          </p>
        </div>

        <button
          id="add-external-profit-btn"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Laba / Biaya Luar</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Grand Net Profit */}
        <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-1">
          <div className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
            Total Laba Bersih Keseluruhan
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatRupiah(grandNetProfit)}
          </div>
          <div className="text-[11px] text-emerald-300 pt-1">
            Akumulasi dari aplikasi + luar aplikasi
          </div>
        </div>

        {/* Laba dari Aplikasi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Laba Penjualan Aplikasi</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-700">
            +{formatRupiah(appSalesProfit)}
          </div>
          <div className="text-[11px] text-slate-400">Dari transaksi online & kasir POS</div>
        </div>

        {/* Laba Luar Aplikasi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Pemasukan Luar Aplikasi</div>
          <div className="text-lg sm:text-xl font-bold text-blue-700">
            +{formatRupiah(externalIncome)}
          </div>
          <div className="text-[11px] text-slate-400">Kardus, titipan, bonus supplier</div>
        </div>

        {/* Biaya / Pengeluaran Luar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Biaya & Beban Operasional</div>
          <div className="text-lg sm:text-xl font-bold text-red-600">
            -{formatRupiah(externalExpense)}
          </div>
          <div className="text-[11px] text-slate-400">Listrik, bensin, plastik, dll.</div>
        </div>
      </div>

      {/* External Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Daftar Catatan Pemasukan / Pengeluaran di Luar Aplikasi ({profits.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Keterangan / Judul</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Belum ada data laba/biaya luar aplikasi yang dicatat.
                  </td>
                </tr>
              ) : (
                profits.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-600">{p.date}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{p.title}</div>
                      {p.notes && <div className="text-[11px] text-slate-400">{p.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {p.type === 'income' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                          <ArrowUpCircle className="w-3 h-3" /> Pemasukan (Laba)
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                          <ArrowDownCircle className="w-3 h-3" /> Pengeluaran
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold text-sm ${
                        p.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {p.type === 'income' ? '+' : '-'}
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Profit / Expense Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Catat Laba / Biaya Luar Aplikasi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Catatan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Pemasukan (Laba)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition ${
                      type === 'expense'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Pengeluaran
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Judul *</label>
                <input
                  id="profit-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jual Kardus Bekas / Beli Plastik Kresek"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    id="profit-amount-input"
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Operasional / Lain-lain / Bonus Supplier"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Rincian catatan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Simpan Catatan
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
