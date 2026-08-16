import React, { useState } from 'react';
import { User, StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  KeyRound, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  X, 
  Check, 
  Users, 
  ShieldAlert,
  Lock,
  Clock
} from 'lucide-react';

interface AdminAdminsProps {
  currentUser: User | null;
  settings: StoreSettings;
  onRefreshUsers: () => void;
}

export const AdminAdmins: React.FC<AdminAdminsProps> = ({
  currentUser,
  settings,
  onRefreshUsers,
}) => {
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'admins' | 'customers'>('admins');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'admin' as 'admin' | 'customer',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshList = () => {
    const list = storage.getUsers();
    setUsers(list);
    onRefreshUsers();
  };

  const adminUsers = users.filter((u) => u.role === 'admin');
  const customerUsers = users.filter((u) => u.role === 'customer');

  const displayedList = (activeTab === 'admins' ? adminUsers : customerUsers).filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      role: 'admin',
      status: 'approved',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      password: user.password || '',
      role: user.role,
      status: user.status || 'approved',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleCustomerApproval = (user: User, newStatus: 'approved' | 'pending' | 'rejected') => {
    storage.updateCustomerStatus(user.id, newStatus);
    refreshList();
    setSuccessMessage(`Status ${user.name} berhasil diubah ke ${newStatus}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nama dan Email wajib diisi!');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();

    // Check duplicate email
    const duplicate = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      setFormError('Email sudah terdaftar pada pengguna lain!');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setFormError('Kata sandi wajib diisi untuk akun baru!');
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        password: formData.password.trim() || editingUser.password || 'admin',
        role: formData.role,
        status: formData.status,
      };
      storage.saveUser(updated);
      setSuccessMessage(`Akun ${updated.name} berhasil diperbarui!`);
    } else {
      const newUser: User = {
        id: (formData.role === 'admin' ? 'admin-' : 'cust-') + Date.now(),
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim() || '081234567890',
        address: formData.address.trim() || settings.storeAddress,
        password: formData.password.trim(),
        role: formData.role,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      storage.saveUser(newUser);
      setSuccessMessage(`Akun baru ${newUser.name} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
    refreshList();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (target.role === 'admin' && adminUsers.length <= 1) {
      alert('Tidak dapat menghapus admin terakhir! Minimal harus ada 1 akun admin aktif.');
      setDeleteConfirmId(null);
      return;
    }

    if (currentUser && currentUser.id === userId) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      setDeleteConfirmId(null);
      return;
    }

    const success = storage.deleteUser(userId);
    if (success) {
      setSuccessMessage(`Akun ${target.name} berhasil dihapus.`);
      setDeleteConfirmId(null);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      alert('Gagal menghapus pengguna.');
    }
  };

  return (
    <div className="space-y-3.5 pb-16">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kelola Admin & Pengguna Toko</span>
            <span className="text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
              {adminUsers.length} Admin Aktif
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daftarkan akun admin kasir baru, perbarui kata sandi, dan pantau daftar akun pelanggan toko.
          </p>
        </div>

        <button
          id="add-admin-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div 
          onClick={() => setActiveTab('admins')}
          className={`cursor-pointer bg-white rounded-xl border p-3 shadow-2xs transition ${
            activeTab === 'admins' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Akun Admin / Kasir</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            {adminUsers.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Akses penuh menu kasir & laporan</p>
        </div>

        <div 
          onClick={() => setActiveTab('customers')}
          className={`cursor-pointer bg-white rounded-xl border p-3 shadow-2xs transition ${
            activeTab === 'customers' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Akun Pelanggan</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            {customerUsers.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Terdaftar untuk belanja online</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white rounded-xl p-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Akun Sedang Aktif</span>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1">
            <div className="font-extrabold text-xs truncate text-white">{currentUser?.name || 'Tamu'}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email || '-'}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex bg-slate-200/70 p-0.5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'admins'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daftar Admin ({adminUsers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Pelanggan ({customerUsers.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-users-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari nama, email, atau nomor HP ${activeTab === 'admins' ? 'admin' : 'pelanggan'}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                <th className="p-3">Nama Pengguna</th>
                <th className="p-3">Email & Kontak</th>
                <th className="p-3">Alamat</th>
                <th className="p-3">Kata Sandi</th>
                <th className="p-3">Status / Role</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada data akun yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                displayedList.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  const formattedDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>Dibuat: {formattedDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="p-3 max-w-[180px]">
                        <div className="truncate text-slate-600" title={user.address || '-'}>
                          {user.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.address}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* Password */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                          <KeyRound className="w-2.5 h-2.5 text-slate-400" />
                          <span>{user.password || 'admin'}</span>
                        </div>
                      </td>

                      {/* Role & Status Badge */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3" /> Admin Toko
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" /> Pelanggan
                              </>
                            )}
                          </span>

                          {user.role === 'customer' && (
                            <div className="flex items-center gap-1">
                              {user.status === 'approved' && (
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Disetujui
                                </span>
                              )}
                              {user.status === 'pending' && (
                                <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5 animate-pulse">
                                  <Clock className="w-2.5 h-2.5" /> Menunggu
                                </span>
                              )}
                              {user.status === 'rejected' && (
                                <span className="text-[9.5px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 flex items-center gap-0.5">
                                  <X className="w-2.5 h-2.5" /> Ditolak
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                            title="Edit Akun & Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === user.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-200">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded hover:bg-red-700"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded hover:bg-slate-300"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(user.id)}
                              disabled={isCurrent || (user.role === 'admin' && adminUsers.length <= 1)}
                              className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-400 disabled:opacity-30 disabled:pointer-events-none rounded-md transition"
                              title={
                                isCurrent
                                  ? 'Tidak dapat menghapus akun Anda sendiri'
                                  : user.role === 'admin' && adminUsers.length <= 1
                                  ? 'Minimal harus ada 1 admin'
                                  : 'Hapus Pengguna'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Add / Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Admin Baru'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {editingUser ? `Perbarui profil atau sandi ${editingUser.name}` : 'Buat akun admin untuk akses kasir POS'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUser} className="p-4 space-y-3">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Siti Fatimah"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email Login *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin2@toko.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat domisili atau toko..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kata Sandi *</label>
                  <input
                    type="text"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Biarkan bila tidak diubah' : 'Minimal 4 karakter'}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Peran / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'customer' })}
                    className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="admin">Admin / Kasir Toko</option>
                    <option value="customer">Pelanggan</option>
                  </select>
                </div>
              </div>

              {formData.role === 'customer' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Status Persetujuan Akun Pelanggan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'approved' | 'pending' | 'rejected' })}
                    className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="approved">Disetujui (Aktif)</option>
                    <option value="pending">Menunggu Persetujuan (Pending)</option>
                    <option value="rejected">Ditolak (Nonaktif)</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
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
