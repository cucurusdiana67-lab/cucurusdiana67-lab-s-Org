import React, { useState } from 'react';
import { StoreSettings, User, ActiveTab } from '../types';
import { storage } from '../lib/storage';
import { 
  Store, 
  ShoppingCart, 
  User as UserIcon, 
  Shield, 
  LogOut, 
  Layers, 
  Calculator, 
  Package, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  ShoppingBag, 
  Settings,
  MapPin,
  Phone,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  settings: StoreSettings;
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
  onOpenAuth: () => void;
  onLogout: () => void;
  onQuickLoginAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentUser,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenAuth,
  onLogout,
  onQuickLoginAdmin,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const adminNavItems = [
    { id: 'admin-pos', label: 'Kasir POS', icon: Calculator, desc: 'Transaksi kasir cepat & cetak struk' },
    { id: 'admin-products', label: 'Kelola Barang', icon: Package, desc: 'Tambah, edit produk & barcode' },
    { id: 'admin-orders', label: 'Daftar Pesanan', icon: FileText, desc: 'Kelola order masuk & status COD' },
    { id: 'admin-reports', label: 'Laporan Penjualan', icon: TrendingUp, desc: 'Omset & peringkat barang terlaris' },
    { id: 'admin-profit', label: 'Perhitungan Laba', icon: TrendingUp, desc: 'Laba bersih & input biaya luar' },
    { id: 'admin-debts', label: 'Kelola Hutang', icon: CreditCard, desc: 'Catatan hutang & cicilan pelanggan' },
    { id: 'admin-restock', label: 'Bon Belanja', icon: ShoppingBag, desc: 'Daftar restock otomatis stok menipis' },
    { id: 'admin-settings', label: 'Kelola Aplikasi', icon: Settings, desc: 'Nama toko, DANA, & database backup' },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-slate-300 text-[11px] font-medium px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px] sm:max-w-md">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{settings.storeAddress}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-slate-400 font-mono text-[10px]">
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>WA: {settings.storePhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Demo Switcher if not logged in */}
            {!currentUser && (
              <button
                id="quick-demo-admin-btn"
                type="button"
                onClick={onQuickLoginAdmin}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition text-[10px] font-bold"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>1-Klik Mode Kasir POS</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="max-w-[90px] sm:max-w-[140px] truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({isAdmin ? 'Admin' : 'Pelanggan'})
                  </span>
                </span>
                <button
                  id="header-logout-btn"
                  type="button"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition text-[10px]"
                  title="Keluar"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                type="button"
                onClick={onOpenAuth}
                className="text-white hover:text-emerald-300 font-semibold flex items-center gap-1 transition text-[11px]"
              >
                <UserIcon className="w-3 h-3 text-emerald-400" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 gap-2">
            {/* Logo & Store Name */}
            <div
              id="brand-logo-btn"
              onClick={() => handleSelectTab('storefront')}
              className="flex items-center gap-2 cursor-pointer group select-none py-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-none tracking-tight group-hover:text-emerald-600 transition truncate">
                    {settings.storeName}
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded leading-none">
                    POS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">{settings.appName}</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Storefront view button */}
              <button
                id="nav-storefront-btn"
                type="button"
                onClick={() => handleSelectTab('storefront')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'storefront'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Katalog</span>
              </button>

              {/* Cart Button */}
              <button
                id="nav-cart-btn"
                type="button"
                onClick={() => handleSelectTab('cart')}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'cart'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keranjang</span>
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold font-mono leading-none text-white bg-emerald-600 rounded-full shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              {currentUser && currentUser.role === 'customer' && (
                <button
                  id="nav-user-profile-btn"
                  type="button"
                  onClick={() => handleSelectTab('user-profile')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'user-profile'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Akun Saya</span>
                </button>
              )}

              {/* Quick Kasir POS Access Button for all (switches to Admin mode or POS) */}
              <button
                id="nav-kasir-pos-quick-btn"
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    onQuickLoginAdmin();
                  } else {
                    handleSelectTab('admin-pos');
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'admin-pos'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kasir POS</span>
              </button>

              {/* Mobile Drawer Toggle */}
              <button
                id="mobile-menu-toggle-btn"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition sm:hidden"
                aria-label="Buka Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Admin Secondary Navigation Bar if in Admin Mode */}
          {isAdmin && (
            <div className="flex items-center gap-1 overflow-x-auto py-1.5 border-t border-slate-100 text-xs no-scrollbar">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5 flex items-center gap-1 shrink-0">
                <Shield className="w-3 h-3 text-emerald-600" /> Panel:
              </span>

              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`admin-subnav-${item.id}`}
                    type="button"
                    onClick={() => handleSelectTab(item.id as ActiveTab)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Drawer / Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs sm:hidden">
          <div className="bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{settings.storeName}</h3>
                  <p className="text-[10px] text-slate-500">Menu & Fitur Lengkap Toko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Mode Switcher in Mobile Drawer */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Status Pengguna</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {currentUser ? (isAdmin ? 'Admin / Kasir' : 'Pelanggan') : 'Tamu'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onQuickLoginAdmin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mode Kasir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      onLogout();
                    } else {
                      onOpenAuth();
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-1.5 px-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentUser ? 'Ganti Akun' : 'Masuk / Daftar'}</span>
                </button>
              </div>
            </div>

            {/* All Menu Items */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400 px-1 pt-1">Halaman Utama</div>
              <button
                type="button"
                onClick={() => handleSelectTab('storefront')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition ${
                  activeTab === 'storefront' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Katalog Belanja</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('cart')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition ${
                  activeTab === 'cart' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Keranjang Belanja ({cartCount})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {currentUser && currentUser.role === 'customer' && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('user-profile')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition ${
                    activeTab === 'user-profile' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-600" />
                    <span>Profil & Riwayat Pesanan Saya</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <div className="text-[10px] font-bold uppercase text-slate-400 px-1 pt-2">Menu Kasir & Admin</div>
              <div className="grid grid-cols-1 gap-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!isAdmin) {
                          onQuickLoginAdmin();
                        }
                        handleSelectTab(item.id as ActiveTab);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-600 shadow-2xs'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar for Mobile Phones */}
      <nav aria-label="Navigasi Bawah Mobile" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 flex items-center justify-around">
        <button
          type="button"
          onClick={() => handleSelectTab('storefront')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'storefront' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Katalog</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isAdmin) onQuickLoginAdmin();
            handleSelectTab('admin-pos');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'admin-pos' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Kasir POS</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isAdmin) onQuickLoginAdmin();
            handleSelectTab('admin-products');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'admin-products' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Barang</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('cart')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'cart' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Keranjang</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-slate-500 hover:text-slate-900 transition"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>
    </>
  );
};
