import React, { useState } from 'react';
import { User, Role } from '../types';
import { storage } from '../lib/storage';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, CheckCircle, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialRole?: Role;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [foundPasswordHint, setFoundPasswordHint] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const users = storage.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (u.password === password || !u.password)
    );

    if (!user) {
      setError('Email atau kata sandi tidak cocok. Silakan periksa kembali!');
      return;
    }

    // Check customer approval status
    if (user.role === 'customer') {
      if (user.status === 'pending') {
        setError('Akun Anda masih berstatus "Menunggu Persetujuan Admin". Silakan hubungi admin toko untuk persetujuan akun.');
        return;
      }
      if (user.status === 'rejected') {
        setError('Akun Anda telah ditolak atau dinonaktifkan oleh Admin. Silakan hubungi pihak toko.');
        return;
      }
    }

    storage.setCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegisterSuccess(false);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Nama, Email, dan Kata Sandi wajib diisi!');
      return;
    }

    const users = storage.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setError('Email sudah terdaftar. Silakan login atau gunakan reset kata sandi!');
      return;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'customer',
      phone: phone.trim() || '081234567890',
      address: address.trim() || 'Alamat Toko / Rumah',
      password: password,
      status: 'pending', // Requires admin approval
      createdAt: new Date().toISOString(),
    };

    storage.saveUser(newUser);
    setRegisterSuccess(true);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(false);
    setFoundPasswordHint(null);

    const users = storage.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());

    if (user) {
      setForgotSuccess(true);
      setFoundPasswordHint(user.password || 'admin');
    } else {
      setError('Email tidak ditemukan dalam sistem database pengguna!');
    }
  };

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/90 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              {tab === 'login' && 'Masuk Akun'}
              {tab === 'register' && 'Daftar Akun Baru'}
              {tab === 'forgot' && 'Reset / Lupa Password'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {tab === 'login' && 'Akses Toko & Kasir (Pelanggan / Admin)'}
              {tab === 'register' && 'Daftarkan akun untuk berbelanja'}
              {tab === 'forgot' && 'Cek kata sandi email terdaftar'}
            </p>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200/90 bg-slate-50/80">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'register'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar
          </button>
          <button
            id="tab-forgot-btn"
            type="button"
            onClick={() => {
              setTab('forgot');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'forgot'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lupa Password
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-[11px] font-bold text-slate-700">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-2xs transition"
              >
                Masuk ke Aplikasi
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            registerSuccess ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Pendaftaran Berhasil!</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Akun <span className="font-bold text-slate-800">{email}</span> telah terdaftar dan saat ini berstatus <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Menunggu Persetujuan Admin</span>.
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200/80 text-[11px] text-slate-600 text-left">
                  <p className="font-semibold text-slate-800 mb-1">Informasi:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[10.5px]">
                    <li>Admin toko akan memverifikasi dan menyetujui akun Anda.</li>
                    <li>Setelah disetujui, Anda dapat langsung login untuk berbelanja.</li>
                  </ul>
                </div>
                <button
                  id="after-reg-login-btn"
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setRegisterSuccess(false);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            ) : (
            <form onSubmit={handleRegister} className="space-y-2.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pendaftaran akun pelanggan untuk kemudahan belanja & pengiriman otomatis.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email</label>
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp</label>
                  <input
                    id="reg-phone-input"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat Pengiriman (Otomatis saat Pesan)</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <textarea
                    id="reg-address-input"
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Melati No. 15, RT 02/05, Desa/Kelurahan..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kata Sandi</label>
                <input
                  id="reg-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-2xs transition mt-1.5"
              >
                Daftar Akun Pelanggan
              </button>
            </form>
            )
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Masukkan Email Akun Anda
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="contoh: budi@gmail.com atau admin@toko.com"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {forgotSuccess && foundPasswordHint && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Akun Ditemukan!
                  </div>
                  <p className="text-[11px]">
                    Kata sandi untuk <span className="font-semibold">{forgotEmail}</span>:{' '}
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-extrabold text-emerald-950">
                      {foundPasswordHint}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-1.5">
                <button
                  id="submit-forgot-btn"
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-2xs transition flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cek Kata Sandi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Kembali
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
