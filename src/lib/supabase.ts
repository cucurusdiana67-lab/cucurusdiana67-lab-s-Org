import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rcyelygybsoertvtbvhi.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVseWd5YnNvZXJ0dnRidmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzcxNTMsImV4cCI6MjEwMjQxMzE1M30.Meik6yFfYr2GvKFdih7ZAuBPKcvaLRiYcgZhy6cHQhg';

// Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'toko-pos-app',
    },
  },
});

/**
 * SQL Schema Relasional Berperforma Tinggi untuk Supabase PostgreSQL
 * Memiliki Foreign Keys, Composite Indexes, Views Laporan, Cascading Delete, & RLS Security.
 */
export const SUPABASE_SCHEMA_SQL = `-- ==========================================================
-- SCHEMA DATABASE RELASIONAL HIGH-PERFORMANCE (POSTGRESQL / SUPABASE)
-- Dirancang untuk kecepatan pencarian, integritas data referensial, & hemat kuota bandwidth (egress).
-- ==========================================================

-- 1. TABEL PENGATURAN TOKO
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  app_name TEXT NOT NULL DEFAULT 'Toko Pintar',
  store_name TEXT NOT NULL DEFAULT 'Toko Barokah Jaya',
  store_address TEXT DEFAULT 'Jl. Raya Utama No. 123, Pasar Sentral',
  store_phone TEXT DEFAULT '081234567890',
  receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
  dana_number TEXT DEFAULT '081234567890',
  dana_holder TEXT DEFAULT 'Nama Pemilik',
  cod_enabled BOOLEAN DEFAULT true,
  dana_enabled BOOLEAN DEFAULT true,
  qris_url TEXT DEFAULT '',
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABEL PENGGUNA / PELANGGAN (USERS)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'admin' | 'customer'
  customer_type TEXT NOT NULL DEFAULT 'general', -- 'general' | 'wholesale'
  phone TEXT,
  address TEXT,
  password_hash TEXT,
  password TEXT,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_customer_type ON users(customer_type);

-- 3. TABEL KATEGORI PRODUK (NORMALISASI RELASIONAL)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABEL PRODUK / BARANG (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (buy_price >= 0),
  sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
  wholesale_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (wholesale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  photo_url TEXT,
  unit TEXT DEFAULT 'Pcs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index Relasional & Pencarian Cepat Kasir / Scanner
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(to_tsvector('indonesian', name));

-- 5. TABEL PESANAN INDUK (ORDERS HEADER)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'pos', -- 'online' | 'pos'
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_type TEXT DEFAULT 'general', -- 'general' | 'wholesale'
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cache item terarsip
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_buy_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash' | 'debt_partial' | 'debt_full' | 'dana' | 'cod'
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_debt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending' | 'processing' | 'completed' | 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index Komposit Analisis Penjualan Cepat
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(type, status);

-- 6. TABEL RINCIAN ITEM PESANAN BERELASI (ORDER ITEMS NORMALIZED)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  category TEXT,
  buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 7. TABEL CATATAN HUTANG PIUTANG (DEBTS)
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'pos', -- 'pos' | 'external'
  original_debt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_debt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid' | 'partial' | 'paid'
  notes TEXT,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_payment_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_debts_customer_name ON debts(customer_name);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_order_id ON debts(order_id);

-- 8. TABEL RIWAYAT CICILAN HUTANG BERELASI (DEBT PAYMENTS)
CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);

-- 9. TABEL ARUS KAS & BIAYA EKSTERNAL (FINANSIAL LABA RUGI)
CREATE TABLE IF NOT EXISTS external_profits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_external_profits_date ON external_profits(date DESC);
CREATE INDEX IF NOT EXISTS idx_external_profits_type ON external_profits(type);

-- ==========================================================
-- 10. DATABASE VIEWS (QUERY CEPAT & RINGAN UNTUK DASHBOARD)
-- ==========================================================

-- View Ringkasan Performa Produk Terlaris
CREATE OR REPLACE VIEW view_top_selling_products AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  p.stock,
  COALESCE(SUM(oi.quantity), 0) AS total_sold_qty,
  COALESCE(SUM(oi.subtotal), 0) AS total_revenue,
  COALESCE(SUM((oi.sell_price - oi.buy_price) * oi.quantity - oi.discount), 0) AS total_profit
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category, p.stock
ORDER BY total_sold_qty DESC;

-- View Ringkasan Keuangan Harian
CREATE OR REPLACE VIEW view_daily_sales_summary AS
SELECT 
  DATE_TRUNC('day', created_at) AS transaction_date,
  COUNT(id) AS total_orders,
  SUM(total_amount) AS gross_revenue,
  SUM(total_buy_cost) AS total_cogs,
  SUM(profit) AS net_profit
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY transaction_date DESC;

-- ==========================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_profits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for debt_payments" ON debt_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access for external_profits" ON external_profits FOR ALL USING (true) WITH CHECK (true);
`;
