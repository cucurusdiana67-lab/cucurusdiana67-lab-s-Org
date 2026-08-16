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

  // Sync state refreshers
  const refreshProducts = () => setProducts(storage.getProducts());
  const refreshOrders = () => setOrders(storage.getOrders());
  const refreshDebts = () => setDebts(storage.getDebts());
  const refreshProfits = () => setProfits(storage.getProfits());

  // Handle Add to Cart
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
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

        {/* ADMIN VIEWS */}
        {activeTab === 'admin-pos' && (
          <AdminPOS
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {activeTab === 'admin-products' && (
          <AdminProducts
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {activeTab === 'admin-orders' && (
          <AdminOrders
            orders={orders}
            settings={settings}
            onRefreshOrders={refreshOrders}
          />
        )}

        {activeTab === 'admin-reports' && (
          <AdminReports orders={orders} settings={settings} />
        )}

        {activeTab === 'admin-profit' && (
          <AdminProfit
            orders={orders}
            profits={profits}
            onRefreshProfits={refreshProfits}
          />
        )}

        {activeTab === 'admin-debts' && (
          <AdminDebts
            debts={debts}
            settings={settings}
            onRefreshDebts={refreshDebts}
          />
        )}

        {activeTab === 'admin-restock' && (
          <AdminRestockBon
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {activeTab === 'admin-settings' && (
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
