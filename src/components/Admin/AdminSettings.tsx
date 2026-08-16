import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { SUPABASE_SCHEMA_SQL, SUPABASE_URL } from '../../lib/supabase';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  Copy, 
  Check, 
  Store, 
  MapPin, 
  Phone, 
  FileText, 
  Wallet, 
  ShieldCheck,
  ExternalLink 
} from 'lucide-react';

interface AdminSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onDataReset: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onDataReset,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(formData);
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonString = storage.exportFullBackup();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_toko_pos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importFullBackup(content);
        if (success) {
          setImportStatus('Data backup berhasil dipulihkan!');
          setTimeout(() => {
            setImportStatus(null);
            window.location.reload();
          }, 1500);
        } else {
          setImportStatus('Format file backup tidak valid!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await storage.syncAllDataToSupabase();
    setIsSyncing(false);
    setSyncFeedback(result);
    setTimeout(() => {
      setSyncFeedback(null);
    }, 6000);
  };

  const handleReset = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke bawaan pabrik (demo)?')) {
      storage.resetToDefault();
      onDataReset();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Kelola Informasi Toko, Aplikasi & Database</span>
          </h2>
          <p className="text-xs text-slate-500">
            Atur identitas toko, alamat, kontak DANA, backup data aplikasi, dan konfigurasi Supabase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Store Profile Settings Form (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
          >
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Identitas & Informasi Toko</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Toko *</label>
                <input
                  id="settings-store-name"
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Aplikasi *</label>
                <input
                  id="settings-app-name"
                  type="text"
                  required
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Toko Lengkap</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <textarea
                  id="settings-store-address"
                  rows={2}
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / Telp Toko</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="settings-store-phone"
                    type="text"
                    value={formData.storePhone}
                    onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batas Minimal Stok (Alert)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* DANA & Payment settings */}
            <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Pembayaran DANA / E-Wallet</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Akun DANA</label>
                  <input
                    id="settings-dana-number"
                    type="text"
                    value={formData.danaNumber}
                    onChange={(e) => setFormData({ ...formData, danaNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pemilik Akun DANA</label>
                  <input
                    id="settings-dana-holder"
                    type="text"
                    value={formData.danaHolder}
                    onChange={(e) => setFormData({ ...formData, danaHolder: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Catatan Kaki Struk Thermal</label>
              <input
                id="settings-receipt-footer"
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              id="save-settings-btn"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Pengaturan Berhasil Disimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </form>
        </div>

        {/* Right: Database Backup & Supabase Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Backup & Restore Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Backup & Restore Data Aplikasi</span>
            </h3>

            <p className="text-xs text-slate-500">
              Unduh seluruh database produk, pesanan, hutang, dan laporan laba dalam format JSON untuk cadangan offline.
            </p>

            {importStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
                {importStatus}
              </div>
            )}

            <div className="space-y-2">
              <button
                id="export-backup-btn"
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export / Unduh Backup Database (JSON)</span>
              </button>

              <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Import / Pulihkan dari File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Supabase Connection & SQL Schema Exporter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supabase Database (Low Egress)</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Terkoneksi
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 truncate">
              URL: {SUPABASE_URL}
            </div>

            <p className="text-xs text-slate-500">
              Query schema database PostgreSQL yang rapi dengan index & RLS policies untuk memastikan egress hemat dan cepat.
            </p>

            {syncFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold border ${
                  syncFeedback.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {syncFeedback.message}
              </div>
            )}

            <div className="space-y-2">
              <button
                id="sync-supabase-now-btn"
                type="button"
                disabled={isSyncing}
                onClick={handleManualSync}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSyncing ? 'Mengunggah Data ke Supabase...' : 'Unggah & Sinkronkan Semua Data ke Supabase'}</span>
              </button>

              <button
                id="copy-sql-schema-btn"
                type="button"
                onClick={handleCopySql}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>SQL Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-600" />
                    <span>Salin Skrip SQL Schema Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reset Danger Zone */}
          <div className="bg-red-50/50 rounded-2xl border border-red-200 p-4 space-y-2">
            <div className="text-xs font-bold text-red-900">Reset Data Bawaan</div>
            <p className="text-[11px] text-red-700">
              Kembalikan seluruh produk, pesanan, dan catatan ke demo bawaan awal.
            </p>
            <button
              id="reset-demo-data-btn"
              type="button"
              onClick={handleReset}
              className="w-full py-2 bg-white hover:bg-red-50 text-red-700 border border-red-300 font-semibold rounded-xl text-xs transition"
            >
              Reset ke Data Awal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
