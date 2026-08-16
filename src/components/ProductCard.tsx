import React, { useState } from 'react';
import { Product, User } from '../types';
import { formatImageUrl, formatRupiah } from '../lib/imageHelper';
import { ShoppingCart, Plus, Minus, Check, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, customPrice?: number) => void;
  isLoggedIn: boolean;
  currentUser?: User | null;
  onRequestLogin: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isLoggedIn,
  currentUser,
  onRequestLogin,
}) => {
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  const isWholesale = currentUser?.customerType === 'wholesale';
  const activePrice = isWholesale && product.wholesalePrice > 0 ? product.wholesalePrice : product.sellPrice;
  const hasWholesaleDiscount = isWholesale && product.wholesalePrice > 0 && product.wholesalePrice < product.sellPrice;

  const handleAdd = () => {
    if (isOutOfStock) return;

    onAddToCart(product, qty, activePrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-emerald-500/80 hover:shadow-xs transition duration-150 flex flex-col justify-between group"
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <img
          src={formatImageUrl(product.photoUrl)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-103 transition duration-200"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs">
          {product.category}
        </span>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-2 right-2 bg-red-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
            Habis
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2 right-2 bg-amber-500/95 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            Sisa {product.stock}
          </span>
        ) : (
          <span className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-medium font-mono px-1.5 py-0.5 rounded-md shadow-2xs">
            Stok: {product.stock}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
              {product.name}
            </h3>
          </div>

          {/* Pricing Box based on Customer Type */}
          <div className="mt-1 space-y-0.5">
            {isWholesale ? (
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-blue-700 font-mono tracking-tight">
                    {formatRupiah(activePrice)}
                  </span>
                  <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                    Harga Borongan
                  </span>
                </div>
                {hasWholesaleDiscount && (
                  <div className="text-[10px] text-slate-400 font-mono line-through">
                    Umum: {formatRupiah(product.sellPrice)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono tracking-tight">
                  {formatRupiah(product.sellPrice)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">/{product.unit || 'pcs'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {/* Quantity selector */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg p-0.5">
            <span className="text-[11px] text-slate-500 font-semibold pl-2">Jumlah:</span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                disabled={qty <= 1 || isOutOfStock}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-bold"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center text-xs font-bold text-slate-900 font-mono">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                disabled={qty >= product.stock || isOutOfStock}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Add to Cart button */}
          <button
            id={`add-cart-btn-${product.id}`}
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Masuk Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Stok Habis' : '+ Pesan Barang'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
