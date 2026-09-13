import React, { useState } from 'react';
import { User, Order, StoreSettings } from '../types';
import { storage } from '../lib/storage';
import { formatRupiah } from '../lib/imageHelper';
import { 
  User as UserIcon, 
  Lock, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  Save, 
  KeyRound, 
  ShieldCheck,
  FileText
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: User;
  orders: Order[];
  settings: StoreSettings;
  onUpdateUser: (user: User) => void;
  onBackToCatalog: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  orders,
  settings,
  onUpdateUser,
  onBackToCatalog,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [notes, setNotes] = useState(currentUser.notes || '');

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter user orders
  const userOrders = orders.filter(
    (o) => o.customerId === currentUser.id || o.customerName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    };

    storage.saveUser(updatedUser);
    storage.setCurrentUser(updatedUser);
    onUpdateUser(updatedUser);

    setProfileMsg('Data profil dan catatan belanja berhasil diperbarui!');
    setTimeout(() => setProfileMsg(null), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (currentUser.password && currentPass !== currentUser.password) {
      setPassMsg({ type: 'error', text: 'Kata sandi saat ini tidak cocok!' });
      return;
    }

    if (!newPass.trim() || newPass.length < 4) {
      setPassMsg({ type: 'error', text: 'Kata sandi baru minimal 4 karakter!' });
      return;
    }

    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok!' });
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass,
    };

    storage.saveUser(updatedUser);
    storage.setCurrentUser(updatedUser);
    onUpdateUser(updatedUser);

    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassMsg({ type: 'success', text: 'Kata sandi berhasil diubah!' });
    setTimeout(() => setPassMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Header Profile */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold font-mono text-lg shadow-2xs">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">{currentUser.name}</h2>
            <div className="text-xs text-slate-500 font-mono">{currentUser.email}</div>
            <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5 font-mono">
              Akun {currentUser.role === 'admin' ? 'Pengelola Toko (Admin)' : 'Pelanggan'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold self-start sm:self-auto transition active:scale-98"
        >
          ← Kembali Belanja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Edit Profile Info */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Informasi Profil & Alamat</span>
          </h3>

          {profileMsg && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email (Akun)</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs font-mono text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp</label>
              <div className="relative">
                <Phone className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat Pengiriman</label>
              <div className="relative">
                <MapPin className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Mawar No. 12..."
                  className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Catatan Belanja & Preferensi Pesanan
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <textarea
                  id="user-profile-shopping-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan belanja rutin, instruksi khusus, atau preferensi pesanan (misal: Tolong pilihkan sayuran yang segar, titip di teras jika rumah kosong, jangan dibungkus plastik tipis, dll)..."
                  className="w-full pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Catatan ini tersimpan di akun Anda dan otomatis terisi saat berbelanja / checkout.
              </p>
            </div>

            <button
              id="save-profile-btn"
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </form>
        </div>

        {/* Right: Change Password */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ubah Kata Sandi</span>
          </h3>

          {passMsg && (
            <div
              className={`p-2 rounded-lg text-xs font-bold border ${
                passMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-2.5 text-xs">
            {currentUser.password && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="new-password-input"
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Konfirmasi Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password-input"
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              id="submit-change-password-btn"
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Perbarui Kata Sandi</span>
            </button>
          </form>
        </div>
      </div>

      {/* User Order History */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Riwayat Pesanan Belanja ({userOrders.length})</span>
        </h3>

        {userOrders.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Anda belum pernah membuat pesanan online.
          </div>
        ) : (
          <div className="space-y-2">
            {userOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 font-mono">#{ord.orderNumber}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      {ord.status}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5 text-[11px] font-mono">
                    {new Date(ord.createdAt).toLocaleString('id-ID')} • {ord.items.length} item
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-emerald-700 text-xs font-mono">
                    {formatRupiah(ord.totalAmount)}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase font-mono">
                    {ord.paymentMethod === 'cod' ? 'COD' : 'DANA'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
