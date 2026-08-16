import React, { useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { storage } from '../../lib/storage';
import { formatImageUrl, formatRupiah } from '../../lib/imageHelper';
import { BarcodeScannerModal } from '../BarcodeScannerModal';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Barcode,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface AdminProductsProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshProducts: () => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  settings,
  onRefreshProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sembako');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('Pcs');
  const [photoUrl, setPhotoUrl] = useState('');

  const defaultCategories = [
    'Sembako',
    'Minuman',
    'Makanan Ringan',
    'Bumbu Dapur',
    'Perlengkapan Rumah',
    'Rokok & Tembakau',
    'Obat & Kosmetik',
    'Lainnya',
  ];

  const uniqueCategories = Array.from(
    new Set([...defaultCategories, ...products.map((p) => p.category)])
  );

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setBarcode('');
    setName('');
    setCategory('Sembako');
    setNewCategoryInput('');
    setBuyPrice(0);
    setSellPrice(0);
    setWholesalePrice(0);
    setStock(10);
    setMinStock(5);
    setUnit('Pcs');
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setBarcode(p.barcode || '');
    setName(p.name);
    setCategory(p.category);
    setNewCategoryInput('');
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setWholesalePrice(p.wholesalePrice || p.sellPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setUnit(p.unit || 'Pcs');
    setPhotoUrl(p.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus barang "${prodName}"?`)) {
      storage.deleteProduct(id);
      onRefreshProducts();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama barang wajib diisi!');
      return;
    }

    const finalCategory = newCategoryInput.trim() || category;
    const sPrice = Number(sellPrice) || 0;
    const wPrice = Number(wholesalePrice) > 0 ? Number(wholesalePrice) : sPrice;

    const productPayload: Product = {
      id: editingId || 'prod-' + Date.now(),
      barcode: barcode.trim(),
      name: name.trim(),
      category: finalCategory,
      buyPrice: Number(buyPrice) || 0,
      sellPrice: sPrice,
      wholesalePrice: wPrice,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5,
      photoUrl: photoUrl.trim(),
      unit: unit.trim() || 'Pcs',
      createdAt: editingId
        ? products.find((p) => p.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveProduct(productPayload);
    onRefreshProducts();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => setBarcode(code)}
        title="Scan Barcode untuk Barang Baru"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Kelola Data Barang</span>
            <span className="text-[11px] font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {products.length} SKU
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manajemen stok, harga modal vs harga jual, scan barcode dan foto Google Drive.
          </p>
        </div>

        <button
          id="add-product-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Barang Baru</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="admin-search-product-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama barang, kategori, atau nomor barcode..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 pl-1 whitespace-nowrap">
            Kategori:
          </span>
          {['Semua', ...uniqueCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Foto</th>
                <th className="py-2.5 px-3">Nama Barang & Barcode</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Modal</th>
                <th className="py-2.5 px-3 text-right">Harga Umum</th>
                <th className="py-2.5 px-3 text-right">Harga Borongan</th>
                <th className="py-2.5 px-3 text-right">Laba/Unit</th>
                <th className="py-2.5 px-3 text-center">Stok</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data barang yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.sellPrice - p.buyPrice;
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3">
                        <img
                          src={formatImageUrl(p.photoUrl)}
                          alt={p.name}
                          className="w-9 h-9 object-cover rounded-md bg-slate-100 border border-slate-200"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>{p.barcode || 'Tanpa Barcode'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-600">
                        {formatRupiah(p.buyPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-700">
                        {formatRupiah(p.sellPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-blue-700">
                        <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-100">
                          {formatRupiah(p.wholesalePrice || p.sellPrice)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(margin)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.stock <= 0
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} {p.unit || 'pcs'}
                          {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-prod-btn-${p.id}`}
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-md transition"
                            title="Edit Barang"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`del-prod-btn-${p.id}`}
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-base">
                {editingId ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Barcode & Scan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Barcode (Scan dari HP / Manual)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-prod-barcode"
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Contoh: 8992753110111"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan HP</span>
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang *</label>
                <input
                  id="input-prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Beras Pandan Wangi 5kg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Kategori</label>
                  <select
                    id="select-prod-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Baru (Opsional)</label>
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Buat kategori baru..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Price: Buy, Sell, and Wholesale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli (Modal)</label>
                  <input
                    id="input-prod-buy-price"
                    type="number"
                    min="0"
                    required
                    value={buyPrice || ''}
                    onChange={(e) => setBuyPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">Harga Jual Umum *</label>
                  <input
                    id="input-prod-sell-price"
                    type="number"
                    min="0"
                    required
                    value={sellPrice || ''}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/40 rounded-lg text-xs font-bold text-emerald-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-blue-800 mb-1">Harga Borongan *</label>
                  <input
                    id="input-prod-wholesale-price"
                    type="number"
                    min="0"
                    value={wholesalePrice || ''}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    placeholder={String(sellPrice || 0)}
                    className="w-full px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-lg text-xs font-bold text-blue-700 font-mono"
                  />
                  <p className="text-[10px] text-blue-600 mt-0.5">Untuk pembeli borongan</p>
                </div>
              </div>

              {/* Stock, Min Stock, Unit */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Tersedia</label>
                  <input
                    id="input-prod-stock"
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Minimal</label>
                  <input
                    id="input-prod-min-stock"
                    type="number"
                    min="0"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    id="input-prod-unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Pcs/Dus/Botol"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Photo URL from Google Drive or Direct Link */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Foto Barang (Bisa Link Google Drive atau Gambar Web)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-prod-photo-url"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/XYZ... atau https://..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                {photoUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <img
                      src={formatImageUrl(photoUrl)}
                      alt="Preview"
                      className="w-8 h-8 object-cover rounded bg-white"
                    />
                    <span className="text-[11px] text-slate-500 truncate flex-1">
                      Preview gambar berhasil diproses
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  id="submit-save-product-btn"
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
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
