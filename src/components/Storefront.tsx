import React, { useState, useMemo } from 'react';
import { Product, CartItem, StoreSettings } from '../types';
import { ProductCard } from './ProductCard';
import { Search, Sparkles, Filter, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatRupiah } from '../lib/imageHelper';

interface StorefrontProps {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenCart: () => void;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  settings,
  cart,
  onAddToCart,
  onOpenCart,
  isLoggedIn,
  onRequestLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Store Header Banner */}
      <div className="relative rounded-xl bg-slate-900 text-white p-4 sm:p-5 shadow-xs overflow-hidden border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Katalog Belanja Online & Kasir POS</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            {settings.storeName}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Menyediakan aneka kebutuhan pokok, sembako, minuman, dan perlengkapan rumah tangga dengan harga terbaik.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-2.5 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Katalog</div>
            <div className="text-sm font-extrabold text-emerald-400 font-mono">{products.length} Produk</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="storefront-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, kategori, atau nomor barcode..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 whitespace-nowrap pl-0.5">
            <Filter className="w-3 h-3 text-emerald-600" /> Kategori:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'Semua'
                ? products.length
                : products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Barang Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada produk yang cocok dengan pencarian "{searchQuery}" pada kategori {selectedCategory}.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Semua');
            }}
            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isLoggedIn={isLoggedIn}
              onRequestLogin={onRequestLogin}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar if items exist */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {totalCartQty} barang dipilih
                </span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  {formatRupiah(totalCartPrice)}
                </span>
              </div>
            </div>

            <button
              id="floating-checkout-btn"
              onClick={onOpenCart}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <span>Lihat Keranjang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
