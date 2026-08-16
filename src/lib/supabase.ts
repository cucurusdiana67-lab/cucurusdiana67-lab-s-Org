import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://rcyelygybsoertvtbvhi.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVseWd5YnNvZXJ0dnRidmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzcxNTMsImV4cCI6MjEwMjQxMzE1M30.Meik6yFfYr2GvKFdih7ZAuBPKcvaLRiYcgZhy6cHQhg';

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
 * SQL Schema definition helper that admin can execute in Supabase SQL editor anytime.
 */
export const SUPABASE_SCHEMA_SQL = `-- SCHEMA DATABASE SUPABASE UNTUK APLIKASI TOKO & KASIR POS
-- Jalankan query ini di menu SQL Editor pada Supabase dashboard jika ingin membuat tabel secara manual

-- 1. Tabel Pengaturan Toko
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

-- 2. Tabel Produk / Barang
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  buy_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  photo_url TEXT,
  unit TEXT DEFAULT 'Pcs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index barcode dan kategori untuk query cepat dan hemat egress
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 3. Tabel Pengguna
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  phone TEXT,
  address TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Pesanan & Penjualan
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'online' | 'pos'
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  total_discount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  total_buy_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  remaining_debt NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);

-- 5. Tabel Catatan Hutang
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_id TEXT,
  source TEXT NOT NULL DEFAULT 'pos',
  original_debt NUMERIC NOT NULL,
  remaining_debt NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_payment_date TIMESTAMP WITH TIME ZONE
);

-- 6. Tabel Laba / Biaya Eksternal
CREATE TABLE IF NOT EXISTS external_profits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS Policies (Allow read/write for Anon with anon key)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_profits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for external_profits" ON external_profits FOR ALL USING (true) WITH CHECK (true);
`;
