import React, { useState, useEffect } from 'react';
import { 
  Product, 
  StoreSettings, 
  User, 
  Order, 
  DebtRecord, 
  ExternalProfitRecord, 
  CartItem, 
  ActiveTab 
} from './types';
import { storage } from './lib/storage';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { CartPage } from './components/CartPage';
import { AuthModal } from './components/AuthModal';
import { UserProfileView } from './components/UserProfileView';
import { AdminPOS } from './components/Admin/AdminPOS';
import { AdminProducts } from './components/Admin/AdminProducts';
import { AdminOrders } from './components/Admin/AdminOrders';
import { AdminReports } from './components/Admin/AdminReports';
import { AdminProfit } from './components/Admin/AdminProfit';
import { AdminDebts } from './components/Admin/AdminDebts';
import { AdminRestockBon } from './components/Admin/AdminRestockBon';
import { AdminAdmins } from './components/Admin/AdminAdmins';
import { AdminCustomers } from './components/Admin/AdminCustomers';
import { AdminSettings } from './components/Admin/AdminSettings';

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(() => storage.getSettings());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [debts, setDebts] = useState<DebtRecord[]>(() => storage.getDebts());
  const [profits, setProfits] = useState<ExternalProfitRecord[]>(() => storage.getProfits());
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());

  const [activeTab, setActiveTab] = useState<ActiveTab>('storefront');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync state refreshers from local/cloud storage
  const refreshAllState = () => {
    setSettings(storage.getSettings());
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setDebts(storage.getDebts());
    setProfits(storage.getProfits());
    setCurrentUser(storage.getCurrentUser());
  };

  const refreshProducts = () => setProducts(storage.getProducts());
  const refreshOrders = () => setOrders(storage.getOrders());
  const refreshDebts = () => setDebts(storage.getDebts());
  const refreshProfits = () => setProfits(storage.getProfits());

  // Setup live sync with Supabase and cross-tab/device storage updates
  useEffect(() => {
    // 1. Initial pull from Supabase cloud
    storage.pullAllDataFromSupabase(true).then(() => {
      refreshAllState();
    });

    // 2. Subscribe to internal storage and realtime changes
    const unsubscribe = storage.subscribe(() => {
      refreshAllState();
    });

    // 3. Window sync event listener
    const handleSyncEvent = () => {
      refreshAllState();
    };
    window.addEventListener('app_storage_synced', handleSyncEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('app_storage_synced', handleSyncEvent);
    };
  }, []);

  // Clean up cart items if a product was deleted
  useEffect(() => {
    setCart((prevCart) => {
      const validCart = prevCart.filter((item) => products.some((p) => p.id === item.product.id));
      return validCart.length !== prevCart.length ? validCart : prevCart;
    });
  }, [products]);

  // Handle Add to Cart
  const handleAddToCart = (product: Product, quantity: number, customPrice?: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty, customPrice: customPrice ?? item.customPrice } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity), customPrice }];
    });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleQuickLoginAdmin = () => {
    const users = storage.getUsers();
    const adminUser = users.find((u) => u.role === 'admin') || {
      id: 'admin-1',
      name: 'Admin Toko',
      email: 'admin@toko.com',
      role: 'admin',
      phone: '081234567890',
      address: 'Jl. Utama Toko No. 1',
      createdAt: new Date().toISOString(),
    };
    storage.setCurrentUser(adminUser);
    setCurrentUser(adminUser);
    setActiveTab('admin-pos');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin-pos');
    } else {
      setActiveTab('storefront');
    }
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('storefront');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-14 sm:pb-0">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onQuickLoginAdmin={handleQuickLoginAdmin}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* VIEW 1: Storefront / Catalog */}
        {activeTab === 'storefront' && (
          <Storefront
            products={products}
            settings={settings}
            cart={cart}
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setActiveTab('cart')}
            isLoggedIn={!!currentUser}
            onRequestLogin={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: Customer Cart & Checkout */}
        {activeTab === 'cart' && (
          <CartPage
            cart={cart}
            settings={settings}
            currentUser={currentUser}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onBackToShop={() => setActiveTab('storefront')}
            onOrderCompleted={() => {
              refreshProducts();
              refreshOrders();
            }}
          />
        )}

        {/* VIEW 3: User Profile & Password Change */}
        {activeTab === 'user-profile' && currentUser && (
          <UserProfileView
            currentUser={currentUser}
            orders={orders}
            settings={settings}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onBackToCatalog={() => setActiveTab('storefront')}
          />
        )}

        {/* ADMIN VIEWS ACCESS GUARD */}
        {activeTab.startsWith('admin-') && currentUser?.role !== 'admin' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-8 shadow-sm">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Akses Khusus Admin</h3>
            <p className="text-xs text-slate-600 mb-6">
              Menu Kasir POS dan panel administrasi hanya dapat diakses setelah masuk dengan akun Admin yang terdaftar.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Masuk Akun Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('storefront')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Kembali ke Katalog
              </button>
            </div>
          </div>
        )}

        {/* ADMIN VIEWS */}
        {currentUser?.role === 'admin' && activeTab === 'admin-pos' && (
          <AdminPOS
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-products' && (
          <AdminProducts
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-orders' && (
          <AdminOrders
            orders={orders}
            settings={settings}
            onRefreshOrders={refreshOrders}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-reports' && (
          <AdminReports orders={orders} settings={settings} />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-profit' && (
          <AdminProfit
            orders={orders}
            profits={profits}
            onRefreshProfits={refreshProfits}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-debts' && (
          <AdminDebts
            debts={debts}
            settings={settings}
            onRefreshDebts={refreshDebts}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-restock' && (
          <AdminRestockBon
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-customers' && (
          <AdminCustomers
            currentUser={currentUser}
            settings={settings}
            onRefreshUsers={() => {
              // trigger re-renders if necessary
            }}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-admins' && (
          <AdminAdmins
            currentUser={currentUser}
            settings={settings}
            onRefreshUsers={() => {
              // trigger re-renders if necessary
            }}
          />
        )}

        {currentUser?.role === 'admin' && activeTab === 'admin-settings' && (
          <AdminSettings
            settings={settings}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onDataReset={() => {
              refreshProducts();
              refreshOrders();
              refreshDebts();
              refreshProfits();
            }}
          />
        )}
      </main>

      {/* Global Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
