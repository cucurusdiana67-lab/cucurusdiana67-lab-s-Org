import React, { useState, useEffect } from 'react';
import { User, CustomerStatus, StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  AlertCircle,
  Send,
  Lock,
  Filter,
  FileText
} from 'lucide-react';

interface AdminCustomersProps {
  currentUser: User | null;
  settings: StoreSettings;
  onRefreshUsers?: () => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  currentUser,
  settings,
  onRefreshUsers,
}) => {
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    password: '',
    customerType: 'general' as 'general' | 'wholesale',
    status: 'approved' as CustomerStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshList = () => {
    const list = storage.getUsers();
    setUsers(list);
    if (onRefreshUsers) onRefreshUsers();
  };

  // Subscribe to real-time local & remote storage updates
  useEffect(() => {
    refreshList();
    const unsubscribe = storage.subscribe(refreshList);
    return () => unsubscribe();
  }, []);

  // Only customers
  const customers = users.filter((u) => u.role === 'customer');

  const pendingCount = customers.filter((c) => (c.status || 'pending') === 'pending').length;
  const approvedCount = customers.filter((c) => (c.status || 'pending') === 'approved').length;
  const rejectedCount = customers.filter((c) => c.status === 'rejected').length;

  const filteredCustomers = customers.filter((c) => {
    const status = c.status || 'pending';
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleUpdateStatus = (customer: User, newStatus: CustomerStatus) => {
    storage.updateCustomerStatus(customer.id, newStatus);
    refreshList();

    const statusLabels: Record<CustomerStatus, string> = {
      approved: 'disetujui (Aktif)',
      rejected: 'ditolak (Nonaktif)',
      pending: 'diubah ke Menunggu Persetujuan',
    };

    showToast(`Akun pelanggan "${customer.name}" berhasil ${statusLabels[newStatus]}.`);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      password: '',
      customerType: 'general',
      status: 'approved',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: User) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      password: customer.password || '',
      customerType: customer.customerType || 'general',
      status: customer.status || 'approved',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nama lengkap pelanggan wajib diisi!');
      return;
    }

    // Auto-generate email if left blank
    const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');
    let cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      cleanEmail = cleanPhone ? `${cleanPhone}@pelanggan.local` : `cust_${Date.now()}@pelanggan.local`;
    }

    // Check duplicate email
    const duplicate = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!editingCustomer || u.id !== editingCustomer.id)
    );
    if (duplicate) {
      setFormError('Email / No HP sudah digunakan oleh akun pelanggan lain!');
      return;
    }

    const defaultPwd = formData.password.trim() || '123456';

    if (editingCustomer) {
      const updated: User = {
        ...editingCustomer,
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        password: defaultPwd,
        customerType: formData.customerType,
        status: formData.status,
      };
      storage.saveUser(updated);
      showToast(`Data pelanggan "${updated.name}" berhasil disimpan.`);
    } else {
      const newCustomer: User = {
        id: 'user-cust-' + Date.now(),
        name: formData.name.trim(),
        email: cleanEmail,
        phone: formData.phone.trim() || '081234567890',
        address: formData.address.trim() || settings.storeAddress,
        notes: formData.notes.trim() || undefined,
        password: defaultPwd,
        role: 'customer',
        customerType: formData.customerType,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      storage.saveUser(newCustomer);
      showToast(`Pelanggan baru "${newCustomer.name}" (${newCustomer.customerType === 'wholesale' ? 'Borongan' : 'Umum'}) berhasil disimpan.`);
    }

    refreshList();
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const target = users.find((u) => u.id === customerId);
    if (!target) return;

    storage.deleteUser(customerId);
    refreshList();
    setDeleteConfirmId(null);
    showToast(`Akun pelanggan "${target.name}" telah dihapus dari sistem.`);
  };

  const handleSendWhatsappGreeting = (customer: User) => {
    if (!customer.phone) {
      alert('Nomor HP / WhatsApp pelanggan belum diisi.');
      return;
    }
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    
    let text = `Halo Kak ${customer.name}, `;
    if ((customer.status || 'pending') === 'approved') {
      text += `akun Anda di *${settings.storeName}* telah disetujui! Anda sekarang dapat masuk dan memesan barang secara online. Terima kasih telah berbelanja bersama kami.`;
    } else {
      text += `kami dari *${settings.storeName}* menginformasikan mengenai akun Anda.`;
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Kelola Akun Pelanggan
                </h2>
                <p className="text-xs text-slate-500">
                  Persetujuan pendaftaran pelanggan, edit data profil, dan pengaturan status akun
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-customer-btn"
              type="button"
              onClick={handleOpenAddModal}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Total Pelanggan</span>
              <Users className={`w-4 h-4 ${statusFilter === 'all' ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div className="text-xl font-extrabold mt-1">{customers.length}</div>
          </div>

          <div 
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              statusFilter === 'pending' 
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                : 'bg-amber-50/70 hover:bg-amber-100/60 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>Menunggu Persetujuan</span>
              <Clock className={`w-4 h-4 ${statusFilter === 'pending' ? 'text-white' : 'text-amber-600'}`} />
            </div>
            <div className="text-xl font-extrabold mt-1 flex items-center gap-1.5">
              <span>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusFilter === 'pending' ? 'bg-white text-amber-800' : 'bg-amber-200 text-amber-900'}`}>
                  Perlu Ditinjau
                </span>
              )}
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter('approved')}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              statusFilter === 'approved' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                : 'bg-emerald-50/70 hover:bg-emerald-100/60 text-emerald-900 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${statusFilter === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>Akun Disetujui</span>
              <UserCheck className={`w-4 h-4 ${statusFilter === 'approved' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <div className="text-xl font-extrabold mt-1">{approvedCount}</div>
          </div>

          <div 
            onClick={() => setStatusFilter('rejected')}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              statusFilter === 'rejected' 
                ? 'bg-red-600 text-white border-red-600 shadow-2xs' 
                : 'bg-red-50/70 hover:bg-red-100/60 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${statusFilter === 'rejected' ? 'text-red-100' : 'text-red-700'}`}>Akun Ditolak</span>
              <UserX className={`w-4 h-4 ${statusFilter === 'rejected' ? 'text-white' : 'text-red-600'}`} />
            </div>
            <div className="text-xl font-extrabold mt-1">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-customer-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, no. HP, alamat..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Menunggu ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>Disetujui ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
            }`}
          >
            <X className="w-3 h-3" />
            <span>Ditolak ({rejectedCount})</span>
          </button>
        </div>
      </div>

      {/* Customer List Cards / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200/90 text-slate-500 space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-medium">Tidak ada data pelanggan yang cocok dengan filter atau pencarian.</p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((customer) => {
            const status = customer.status || 'pending';
            const isPending = status === 'pending';
            const isApproved = status === 'approved';
            const isRejected = status === 'rejected';

            return (
              <div
                key={customer.id}
                id={`customer-card-${customer.id}`}
                className={`bg-white rounded-xl p-4 shadow-xs border transition flex flex-col justify-between ${
                  isPending 
                    ? 'border-amber-300 ring-1 ring-amber-200/60 bg-amber-50/20' 
                    : isRejected 
                    ? 'border-red-200 opacity-85' 
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{customer.name}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    </div>

                    {/* Status & Customer Type Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {customer.customerType === 'wholesale' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                          <span>Borongan / Grosir</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <span>Umum (Eceran)</span>
                        </span>
                      )}

                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Disetujui</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse font-mono">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Menunggu</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-100 text-red-800 border border-red-300 font-mono">
                          <X className="w-3 h-3 text-red-600" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Details info */}
                  <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{customer.phone || '-'}</span>
                      </div>
                      {customer.phone && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsappGreeting(customer)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
                          title="Hubungi via WhatsApp"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Chat WA</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 line-clamp-2">{customer.address || 'Alamat belum diatur'}</span>
                    </div>

                    {customer.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] bg-amber-50/70 p-1.5 rounded-md border border-amber-200/60 text-amber-900">
                        <FileText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-[10px] text-amber-800 uppercase block">Catatan Belanja:</span>
                          <span className="text-amber-900 line-clamp-2">{customer.notes}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        <span>Daftar: {new Date(customer.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="font-mono text-slate-400">
                        Pass: <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">{customer.password || '123'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {/* Approval / Rejection Quick Toggles */}
                  <div className="flex items-center gap-1">
                    {isPending ? (
                      <>
                        <button
                          id={`approve-btn-${customer.id}`}
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                          title="Setujui Akun Pelanggan"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          id={`reject-btn-${customer.id}`}
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'rejected')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 active:scale-98 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                          title="Tolak Akun Pelanggan"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'rejected')}
                          className="px-2 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Tolak / Nonaktifkan Akun"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Nonaktifkan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'pending')}
                          className="px-2 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Kembalikan ke status Menunggu"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                          title="Aktifkan Kembali Akun"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui Akun</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(customer, 'pending')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold transition"
                          title="Ubah ke status Menunggu"
                        >
                          Pending
                        </button>
                      </>
                    )}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-cust-btn-${customer.id}`}
                      type="button"
                      onClick={() => handleOpenEditModal(customer)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition"
                      title="Edit Data Pelanggan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`delete-cust-btn-${customer.id}`}
                      type="button"
                      onClick={() => setDeleteConfirmId(customer.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOMER */}
      {isModalOpen && (
        <div id="customer-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/90 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingCustomer ? 'Perbarui informasi & status persetujuan pelanggan' : 'Daftarkan akun pelanggan baru secara langsung'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email (Opsional)</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com (atau kosongkan)"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp / HP</label>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat Pengiriman</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Melati No. 15, RT 02/05..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Catatan Belanja / Catatan Khusus Pelanggan
                </label>
                <textarea
                  id="admin-customer-notes-input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tuliskan catatan belanja rutin, patokan rumah, barang langganan, atau instruksi pesanan khusus pelanggan..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Jenis Pelanggan Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jenis Pelanggan (Penentuan Harga Saat Login)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customerType: 'general' })}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-start border transition ${
                      formData.customerType === 'general'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-extrabold">Pelanggan Umum</span>
                    <span className={`text-[10px] font-normal mt-0.5 ${formData.customerType === 'general' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Mendapatkan Harga Jual Eceran
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customerType: 'wholesale' })}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-start border transition ${
                      formData.customerType === 'wholesale'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                        : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <span className="font-extrabold">Pelanggan Borongan</span>
                    <span className={`text-[10px] font-normal mt-0.5 ${formData.customerType === 'wholesale' ? 'text-blue-200' : 'text-blue-600'}`}>
                      Mendapatkan Harga Borongan
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Persetujuan Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Status Persetujuan Akun
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'approved' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                      formData.status === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Disetujui</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'pending' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                      formData.status === 'pending'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Menunggu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'rejected' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                      formData.status === 'rejected'
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>Ditolak</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {editingCustomer ? 'Ubah Kata Sandi (Kosongkan jika tidak diganti)' : 'Kata Sandi (Opsional - Default: 123456)'}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingCustomer ? 'Kata sandi saat ini' : 'Default: 123456'}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-4 space-y-3 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-sm text-slate-900">Hapus Akun Pelanggan?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Akun pelanggan ini akan dihapus dari sistem. Pelanggan tidak akan dapat login lagi.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCustomer(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
