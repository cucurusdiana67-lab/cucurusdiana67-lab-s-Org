import React, { useState } from 'react';
import { DebtRecord, StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { formatRupiah } from '../../lib/imageHelper';
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User as UserIcon, 
  Phone, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDebtsProps {
  debts: DebtRecord[];
  settings: StoreSettings;
  onRefreshDebts: () => void;
}

export const AdminDebts: React.FC<AdminDebtsProps> = ({
  debts,
  settings,
  onRefreshDebts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid_partial' | 'paid'>('unpaid_partial');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Add Debt Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [originalDebt, setOriginalDebt] = useState<number>(0);
  const [debtNotes, setDebtNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('Angsuran hutang');

  // Filtered Debts
  const filteredDebts = debts.filter((d) => {
    const matchSearch =
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.customerPhone && d.customerPhone.includes(searchQuery)) ||
      (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'unpaid_partial') {
      return matchSearch && d.remainingDebt > 0;
    } else if (statusFilter === 'paid') {
      return matchSearch && d.remainingDebt === 0;
    }
    return matchSearch;
  });

  const totalOutstandingDebt = debts.reduce((sum, d) => sum + d.remainingDebt, 0);
  const activeDebtorsCount = debts.filter((d) => d.remainingDebt > 0).length;

  const handleOpenAdd = () => {
    setCustomerName('');
    setCustomerPhone('');
    setOriginalDebt(0);
    setDebtNotes('');
    setIsAddModalOpen(true);
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || originalDebt <= 0) {
      alert('Nama pelanggan dan jumlah hutang wajib diisi!');
      return;
    }

    const newDebt: DebtRecord = {
      id: 'debt-ext-' + Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      source: 'external',
      originalDebt: Number(originalDebt),
      remainingDebt: Number(originalDebt),
      status: 'unpaid',
      notes: debtNotes.trim() || 'Catatan hutang luar aplikasi',
      createdAt: new Date().toISOString(),
      payments: [],
    };

    storage.createDebtRecord(newDebt);
    onRefreshDebts();
    setIsAddModalOpen(false);
  };

  const handleOpenPay = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    setPayAmount(debt.remainingDebt);
    setPayNotes('Pembayaran angsuran/lunas');
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || payAmount <= 0) return;

    if (payAmount > selectedDebt.remainingDebt) {
      alert('Jumlah pembayaran melebihi sisa hutang!');
      return;
    }

    storage.payDebtInstallment(selectedDebt.id, payAmount, payNotes);
    onRefreshDebts();
    setIsPayModalOpen(false);

    if (payAmount === selectedDebt.remainingDebt) {
      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Manajemen Hutang Piutang Pelanggan</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pantau hutang dari kasir POS & catat hutang luar aplikasi, kelola angsuran dan pelunasan.
          </p>
        </div>

        <button
          id="add-debt-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Catat Hutang Baru (Luar Toko)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-red-50/80 border border-red-200/90 p-3 rounded-xl shadow-2xs space-y-0.5">
          <div className="text-[11px] text-red-800 font-bold uppercase">Sisa Piutang Berjalan</div>
          <div className="text-lg sm:text-xl font-extrabold text-red-700 font-mono">
            {formatRupiah(totalOutstandingDebt)}
          </div>
          <div className="text-[10px] text-red-600">Total tanggungan belum tertagih</div>
        </div>

        <div className="bg-white border border-slate-200/90 p-3 rounded-xl shadow-2xs space-y-0.5">
          <div className="text-[11px] text-slate-500 font-bold uppercase">Jumlah Orang Berhutang</div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
            {activeDebtorsCount} <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="text-[10px] text-slate-400">Pelanggan aktif memiliki sisa tagihan</div>
        </div>

        <div className="bg-white border border-slate-200/90 p-3 rounded-xl shadow-2xs space-y-0.5">
          <div className="text-[11px] text-slate-500 font-bold uppercase">Total Catatan Transaksi</div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
            {debts.length} <span className="text-xs font-normal text-slate-500">Record</span>
          </div>
          <div className="text-[10px] text-slate-400">Termasuk yang sudah lunas</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-debts-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan, nomor WhatsApp, atau keterangan hutang..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
          />
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid_partial')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              statusFilter === 'unpaid_partial'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Belum Lunas ({activeDebtorsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              statusFilter === 'paid'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sudah Lunas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Debts Cards List */}
      <div className="space-y-2">
        {filteredDebts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada catatan hutang yang cocok dengan filter.
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isExpanded = expandedDebtId === debt.id;
            const isPaid = debt.remainingDebt <= 0;
            const totalPaid = debt.payments.reduce((s, p) => s + p.amount, 0);

            return (
              <div
                key={debt.id}
                className={`bg-white rounded-xl border overflow-hidden shadow-2xs transition ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {debt.customerName}
                        </span>
                        {isPaid ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> LUNAS
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> BELUM LUNAS
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono font-medium">
                          {debt.source === 'pos' ? 'POS' : 'Luar'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2.5 flex-wrap">
                        {debt.customerPhone && (
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {debt.customerPhone}
                          </span>
                        )}
                        <span className="font-mono text-[10px]">Tgl: {new Date(debt.createdAt).toLocaleDateString('id-ID')}</span>
                        {debt.notes && <span className="italic text-slate-600">"{debt.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  {/* Financial numbers & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Awal: {formatRupiah(debt.originalDebt)}
                      </div>
                      <div
                        className={`text-sm font-extrabold font-mono ${
                          isPaid ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        Sisa: {formatRupiah(debt.remainingDebt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => handleOpenPay(debt)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Angsur / Lunas</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                        className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition"
                        title="Riwayat Pembayaran"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Payment History */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1.5 border-t border-slate-100 bg-slate-50/60 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <History className="w-3 h-3 text-emerald-600" />
                      <span>Riwayat Angsuran ({debt.payments.length} kali):</span>
                    </div>

                    {debt.payments.length === 0 ? (
                      <div className="text-slate-400 italic text-[11px] py-0.5">Belum ada pembayaran dicatat.</div>
                    ) : (
                      <div className="bg-white rounded-md border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                        {debt.payments.map((pay) => (
                          <div key={pay.id} className="p-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-extrabold text-slate-800 font-mono">
                                +{formatRupiah(pay.amount)}
                              </span>
                              <span className="text-slate-400 text-[10px] font-mono ml-2">
                                ({new Date(pay.date).toLocaleString('id-ID')})
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px]">{pay.notes}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add External Debt */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Catat Hutang Luar Aplikasi</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
                <input
                  id="debt-cust-name-input"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Pak RT Slamet"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  id="debt-cust-phone-input"
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Hutang (Rp) *</label>
                <input
                  id="debt-amount-input"
                  type="number"
                  min="1000"
                  required
                  value={originalDebt || ''}
                  onChange={(e) => setOriginalDebt(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-red-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Alasan Hutang</label>
                <textarea
                  id="debt-notes-input"
                  rows={2}
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="Contoh: Belanja beras & minyak arisan keluarga"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Simpan Catatan Hutang
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pay / Installment Debt */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Bayar / Angsur Hutang Pelanggan</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Nama: <b className="text-slate-900">{selectedDebt.customerName}</b></div>
                <div className="text-slate-500">Total Awal: <b>{formatRupiah(selectedDebt.originalDebt)}</b></div>
                <div className="text-red-700 font-bold text-sm">
                  Sisa Hutang Saat Ini: {formatRupiah(selectedDebt.remainingDebt)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  id="pay-installment-amount-input"
                  type="number"
                  min="100"
                  max={selectedDebt.remainingDebt}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedDebt.remainingDebt)}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-semibold"
                  >
                    Bayar Lunas Langsung ({formatRupiah(selectedDebt.remainingDebt)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pembayaran</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Angsuran via transfer / tunai di toko"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Konfirmasi Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
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
