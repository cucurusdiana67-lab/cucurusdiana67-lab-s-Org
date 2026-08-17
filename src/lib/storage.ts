import { Product, StoreSettings, User, Order, DebtRecord, ExternalProfitRecord } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'toko_settings_v1',
  PRODUCTS: 'toko_products_v1',
  USERS: 'toko_users_v1',
  CURRENT_USER: 'toko_current_user_v1',
  ORDERS: 'toko_orders_v1',
  DEBTS: 'toko_debts_v1',
  PROFITS: 'toko_profits_v1',
  LAST_SYNC: 'toko_last_sync_v1',
};

export const INITIAL_SETTINGS: StoreSettings = {
  appName: 'Toko Pintar & POS',
  storeName: 'Toko Berkah Sejahtera',
  storeAddress: 'Jl. Ahmad Yani No. 88, Pusat Niaga & Pasar',
  storePhone: '0812-9876-5432',
  receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian. Terima kasih!',
  danaNumber: '081298765432',
  danaHolder: 'Berkah Sejahtera Store',
  codEnabled: true,
  danaEnabled: true,
  qrisUrl: '',
  lowStockThreshold: 5,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    barcode: '8992753110111',
    name: 'Beras Pandan Wangi Premium 5kg',
    category: 'Sembako',
    buyPrice: 65000,
    sellPrice: 75000,
    wholesalePrice: 71000,
    stock: 24,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    unit: 'Karung',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    barcode: '8999999001234',
    name: 'Minyak Goreng Sania 2 Liter',
    category: 'Sembako',
    buyPrice: 32000,
    sellPrice: 36000,
    wholesalePrice: 34000,
    stock: 18,
    minStock: 6,
    photoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    unit: 'Pouch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    barcode: '8991002101019',
    name: 'Gula Pasir Gulaku Putih 1kg',
    category: 'Sembako',
    buyPrice: 15500,
    sellPrice: 18000,
    wholesalePrice: 16800,
    stock: 30,
    minStock: 8,
    photoUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
    unit: 'Bungkus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    barcode: '8998866200212',
    name: 'Indomie Goreng Spesial (Dus isi 40)',
    category: 'Makanan Ringan',
    buyPrice: 110000,
    sellPrice: 122000,
    wholesalePrice: 116000,
    stock: 12,
    minStock: 4,
    photoUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    unit: 'Dus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    barcode: '8998866200213',
    name: 'Indomie Goreng Spesial Satuan',
    category: 'Makanan Ringan',
    buyPrice: 2800,
    sellPrice: 3500,
    wholesalePrice: 3000,
    stock: 3, // Low stock for test bon belanja
    minStock: 20,
    photoUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    unit: 'Bungkus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    barcode: '8996001301111',
    name: 'Kopi Kapal Api Special Mix 1 Renceng (10 sachet)',
    category: 'Minuman',
    buyPrice: 13500,
    sellPrice: 16000,
    wholesalePrice: 14800,
    stock: 15,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    unit: 'Renceng',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    barcode: '8991389221020',
    name: 'Susu Kental Manis Frisian Flag 370g',
    category: 'Minuman',
    buyPrice: 10500,
    sellPrice: 12500,
    wholesalePrice: 11700,
    stock: 2, // Low stock
    minStock: 10,
    photoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    unit: 'Kaleng',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    barcode: '8993005121015',
    name: 'Teh Celup Sosro Kotak Isi 30',
    category: 'Minuman',
    buyPrice: 6500,
    sellPrice: 8500,
    wholesalePrice: 7500,
    stock: 20,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    unit: 'Kotak',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    barcode: '8992770001010',
    name: 'Sabun Cuci Piring Sunlight Jeruk Nipis 700ml',
    category: 'Perlengkapan Rumah',
    buyPrice: 14000,
    sellPrice: 16500,
    wholesalePrice: 15200,
    stock: 14,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
    unit: 'Pouch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    barcode: '8992770002020',
    name: 'Deterjen Rinso Molto Anti Noda 770g',
    category: 'Perlengkapan Rumah',
    buyPrice: 19500,
    sellPrice: 23000,
    wholesalePrice: 21500,
    stock: 1, // Low stock
    minStock: 8,
    photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    unit: 'Bungkus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-11',
    barcode: '8991001402222',
    name: 'Tepung Terigu Segitiga Biru 1kg',
    category: 'Sembako',
    buyPrice: 11000,
    sellPrice: 13000,
    wholesalePrice: 12200,
    stock: 22,
    minStock: 6,
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    unit: 'Bungkus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    barcode: '8998899112233',
    name: 'Kecap Manis Bango Botol 275ml',
    category: 'Bumbu Dapur',
    buyPrice: 14500,
    sellPrice: 17500,
    wholesalePrice: 16000,
    stock: 16,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    unit: 'Botol',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Pemilik Toko (Admin)',
    email: 'admin@toko.com',
    role: 'admin',
    customerType: 'general',
    phone: '081298765432',
    password: 'admin',
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DEBTS: DebtRecord[] = [];

export const INITIAL_PROFITS: ExternalProfitRecord[] = [];

export const INITIAL_ORDERS: Order[] = [];

// Helper to safely execute background Supabase sync without crashing or blocking
function safeAsync(promise: PromiseLike<any>) {
  Promise.resolve(promise).catch(() => {});
}

class StorageService {
  private isSupabaseOnline = true;
  private lastSyncTimestamp: string | null = null;
  private isSyncing = false;
  private listeners: Array<() => void> = [];
  private realtimeChannel: any = null;
  private broadcastChannel: any = null;

  constructor() {
    this.initLocalData();
    this.setupBroadcastChannel();
    this.setupRealtime();
    // Automatically pull latest data from Supabase in the background
    this.pullAllDataFromSupabase(true).catch(() => {});

    // Periodic automatic background sync every 6 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.pullAllDataFromSupabase(true).catch(() => {});
      }, 6000);

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.pullAllDataFromSupabase(true).catch(() => {});
        }
      });

      window.addEventListener('focus', () => {
        this.pullAllDataFromSupabase(true).catch(() => {});
      });
    }
  }

  private setupBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('toko_pos_sync_channel');
        this.broadcastChannel.onmessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'sync') {
            this.notifyLocalListenersOnly();
          }
        };
      } catch {
        // ignore
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyLocalListenersOnly(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_storage_synced'));
    }
  }

  notifyListeners(broadcastRemote: boolean = false): void {
    this.notifyLocalListenersOnly();

    // Broadcast across browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'sync', time: Date.now() });
      } catch {}
    }

    // Broadcast to other devices via Supabase Realtime Channel
    if (broadcastRemote && this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'db_mutation',
          payload: { timestamp: Date.now() },
        });
      } catch {}
    }
  }

  getSupabaseStatus(): { isOnline: boolean; lastSync: string | null; isSyncing: boolean } {
    return {
      isOnline: this.isSupabaseOnline,
      lastSync: this.lastSyncTimestamp,
      isSyncing: this.isSyncing,
    };
  }

  private initLocalData() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      // Clean up demo customer accounts if present in existing storage
      try {
        const existingUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const demoEmails = ['budi@gmail.com', 'siti@gmail.com', 'ahmad.fauzi@gmail.com'];
        const demoIds = ['user-cust-1', 'user-cust-2', 'user-cust-3'];
        const cleanedUsers = existingUsers.filter(
          (u) => !demoEmails.includes(u.email.toLowerCase()) && !demoIds.includes(u.id)
        );
        if (cleanedUsers.length !== existingUsers.length) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanedUsers.length > 0 ? cleanedUsers : INITIAL_USERS));
        }
      } catch {
        // ignore
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEBTS)) {
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(INITIAL_DEBTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFITS)) {
      localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(INITIAL_PROFITS));
    }
    // Default current user to guest or remembered user
    if (localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      try {
        const cur: User = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
        if (['budi@gmail.com', 'siti@gmail.com', 'ahmad.fauzi@gmail.com'].includes(cur.email?.toLowerCase())) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
      } catch {
        // ignore
      }
    }
  }

  // --- Realtime WebSocket & Broadcast Synchronization ---
  private setupRealtime() {
    try {
      this.realtimeChannel = supabase.channel('toko-realtime-sync-v3');
      this.realtimeChannel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          async (payload: any) => {
            console.log('Realtime postgres_changes detected:', payload?.table, payload?.eventType);
            await this.pullAllDataFromSupabase(true);
          }
        )
        .on('broadcast', { event: 'db_mutation' }, async (payload: any) => {
          console.log('Realtime broadcast mutation detected from another device:', payload);
          await this.pullAllDataFromSupabase(true);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isSupabaseOnline = true;
          }
        });
    } catch (err) {
      console.warn('Realtime subscription skipped or unavailable:', err);
    }
  }

  // --- PULL / DOWNLOAD ALL DATA FROM SUPABASE CLOUD ---
  async pullAllDataFromSupabase(isAuto: boolean = false): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing && !isAuto) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    try {
      // 1. Fetch Store Settings
      const { data: remoteSettings, error: setErr } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);

      if (!setErr && remoteSettings && remoteSettings.length > 0) {
        const rs = remoteSettings[0];
        const settings: StoreSettings = {
          appName: rs.app_name || rs.appName || INITIAL_SETTINGS.appName,
          storeName: rs.store_name || rs.storeName || INITIAL_SETTINGS.storeName,
          storeAddress: rs.store_address || rs.storeAddress || INITIAL_SETTINGS.storeAddress,
          storePhone: rs.store_phone || rs.storePhone || INITIAL_SETTINGS.storePhone,
          receiptFooter: rs.receipt_footer || rs.receiptFooter || INITIAL_SETTINGS.receiptFooter,
          danaNumber: rs.dana_number || rs.danaNumber || INITIAL_SETTINGS.danaNumber,
          danaHolder: rs.dana_holder || rs.danaHolder || INITIAL_SETTINGS.danaHolder,
          codEnabled: rs.cod_enabled !== undefined ? rs.cod_enabled : true,
          danaEnabled: rs.dana_enabled !== undefined ? rs.dana_enabled : true,
          qrisUrl: rs.qris_url || rs.qrisUrl || '',
          lowStockThreshold: rs.low_stock_threshold || rs.lowStockThreshold || 5,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }

      // 2. Fetch Products
      const { data: remoteProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!prodErr && remoteProducts) {
        const localProducts = this.getProducts();
        const mappedProducts: Product[] = remoteProducts.map((p: any) => {
          const matchedLocal = localProducts.find((lp) => lp.id === p.id);
          const hasRemoteWholesale = p.wholesale_price !== undefined && p.wholesale_price !== null;
          const finalWholesale = hasRemoteWholesale
            ? Number(p.wholesale_price)
            : Number(matchedLocal?.wholesalePrice ?? p.wholesale_price ?? p.sell_price ?? p.sellPrice ?? 0);

          return {
            id: p.id,
            barcode: p.barcode || '',
            name: p.name,
            category: p.category,
            buyPrice: Number(p.buy_price ?? p.buyPrice ?? 0),
            sellPrice: Number(p.sell_price ?? p.sellPrice ?? 0),
            wholesalePrice: finalWholesale > 0 ? finalWholesale : Number(p.sell_price ?? p.sellPrice ?? 0),
            stock: Number(p.stock ?? 0),
            minStock: Number(p.min_stock ?? p.minStock ?? 5),
            photoUrl: p.photo_url || p.photoUrl || '',
            unit: p.unit || 'Pcs',
            createdAt: p.created_at || p.createdAt || new Date().toISOString(),
            updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
          };
        });
        
        // If Supabase table is populated or explicitly empty, store the exact cloud state
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mappedProducts));
        localStorage.setItem('has_synced_cloud', 'true');
      }

      // 3. Fetch Users (Admins and Customers) with Safe Password & Local Preservation
      const { data: remoteUsers, error: userErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!userErr && remoteUsers) {
        const localUsers = this.getUsers();
        const remoteIds = new Set(remoteUsers.map((u: any) => u.id));
        const remoteEmails = new Set(remoteUsers.map((u: any) => (u.email || '').toLowerCase()));

        const mappedRemoteUsers: User[] = remoteUsers.map((u: any) => {
          const matchedLocal = localUsers.find(
            (lu) => lu.id === u.id || (lu.email && lu.email.toLowerCase() === (u.email || '').toLowerCase())
          );
          // Preserve local password if remote password_hash is not set or empty
          const remotePassword = u.password || u.password_hash;
          const finalPassword =
            remotePassword && remotePassword.trim() !== ''
              ? remotePassword
              : matchedLocal?.password || (u.role === 'admin' ? 'admin' : '123456');

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || 'customer',
            customerType: u.customer_type || u.customerType || matchedLocal?.customerType || 'general',
            phone: u.phone || matchedLocal?.phone || '',
            address: u.address || matchedLocal?.address || '',
            password: finalPassword,
            status: u.status || matchedLocal?.status || (u.role === 'admin' ? 'approved' : 'approved'),
            createdAt: u.created_at || u.createdAt || matchedLocal?.createdAt || new Date().toISOString(),
          };
        });

        // Keep local-only users so newly created local customers are not deleted before or if Supabase sync is delayed
        const localOnlyUsers = localUsers.filter(
          (lu) => !remoteIds.has(lu.id) && !remoteEmails.has((lu.email || '').toLowerCase())
        );

        // Sync local-only users back up to Supabase in background
        localOnlyUsers.forEach((lu) => {
          safeAsync(
            supabase.from('users').upsert({
              id: lu.id,
              name: lu.name,
              email: lu.email,
              role: lu.role,
              customer_type: lu.customerType || 'general',
              phone: lu.phone || null,
              address: lu.address || null,
              password_hash: lu.password || null,
              password: lu.password || null,
              status: lu.status,
              created_at: lu.createdAt,
            })
          );
        });

        const mergedUsers = [...mappedRemoteUsers, ...localOnlyUsers];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));

        // If current logged-in user changed/updated remotely, update active session
        const cur = this.getCurrentUser();
        if (cur) {
          const fresh = mergedUsers.find((u) => u.id === cur.id || u.email.toLowerCase() === cur.email.toLowerCase());
          if (fresh) {
            this.setCurrentUser(fresh);
          }
        }
      }

      // 4. Fetch Orders
      const { data: remoteOrders, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ordErr && remoteOrders) {
        const mappedOrders: Order[] = remoteOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || o.orderNumber,
          type: o.type || 'pos',
          customerId: o.customer_id || o.customerId,
          customerName: o.customer_name || o.customerName,
          customerPhone: o.customer_phone || o.customerPhone,
          customerAddress: o.customer_address || o.customerAddress,
          customerType: o.customer_type || o.customerType || 'general',
          items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
          subtotal: Number(o.subtotal || 0),
          totalDiscount: Number(o.total_discount ?? o.totalDiscount ?? 0),
          totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
          totalBuyCost: Number(o.total_buy_cost ?? o.totalBuyCost ?? 0),
          profit: Number(o.profit || 0),
          paymentMethod: o.payment_method || o.paymentMethod || 'cash',
          amountPaid: Number(o.amount_paid ?? o.amountPaid ?? 0),
          remainingDebt: Number(o.remaining_debt ?? o.remainingDebt ?? 0),
          status: o.status || 'completed',
          notes: o.notes || '',
          createdAt: o.created_at || o.createdAt || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mappedOrders));
      }

      // 5. Fetch Debts
      const { data: remoteDebts, error: debtErr } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!debtErr && remoteDebts) {
        const mappedDebts: DebtRecord[] = remoteDebts.map((d: any) => ({
          id: d.id,
          customerName: d.customer_name || d.customerName,
          customerPhone: d.customer_phone || d.customerPhone,
          customerId: d.customer_id || d.customerId,
          orderId: d.order_id || d.orderId,
          source: d.source || 'pos',
          originalDebt: Number(d.original_debt ?? d.originalDebt ?? 0),
          remainingDebt: Number(d.remaining_debt ?? d.remainingDebt ?? 0),
          status: d.status || 'unpaid',
          notes: d.notes || '',
          payments: typeof d.payments === 'string' ? JSON.parse(d.payments) : (d.payments || []),
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          lastPaymentDate: d.last_payment_date || d.lastPaymentDate,
        }));
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(mappedDebts));
      }

      // 6. Fetch External Profits
      const { data: remoteProfits, error: profErr } = await supabase
        .from('external_profits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profErr && remoteProfits) {
        const mappedProfits: ExternalProfitRecord[] = remoteProfits.map((p: any) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          amount: Number(p.amount || 0),
          category: p.category,
          date: p.date,
          notes: p.notes || '',
          createdAt: p.created_at || p.createdAt || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(mappedProfits));
      }

      this.isSupabaseOnline = true;
      this.lastSyncTimestamp = new Date().toISOString();
      this.notifyListeners(false);

      const prodCount = remoteProducts ? remoteProducts.length : 0;
      const userCount = remoteUsers ? remoteUsers.length : 0;
      return {
        success: true,
        message: `Sinkronisasi data cloud sukses! Memuat ${prodCount} produk dan ${userCount} pengguna dari database Supabase.`,
      };
    } catch (err: any) {
      console.error('Error pulling from Supabase:', err);
      this.isSupabaseOnline = false;
      return {
        success: false,
        message: `Gagal memuat data dari cloud: ${err?.message || 'Koneksi database terputus'}`,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- SETTINGS ---
  getSettings(): StoreSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  saveSettings(settings: StoreSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notifyListeners(true);
    // Asynchronously update supabase
    safeAsync(
      supabase.from('store_settings').upsert({
        id: 'default',
        app_name: settings.appName,
        store_name: settings.storeName,
        store_address: settings.storeAddress,
        store_phone: settings.storePhone,
        receipt_footer: settings.receiptFooter,
        dana_number: settings.danaNumber,
        dana_holder: settings.danaHolder,
        cod_enabled: settings.codEnabled,
        dana_enabled: settings.danaEnabled,
        qris_url: settings.qrisUrl,
        low_stock_threshold: settings.lowStockThreshold,
        updated_at: new Date().toISOString(),
      })
    );
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  saveProduct(product: Product): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    const updated: Product = {
      ...product,
      wholesalePrice: Number(product.wholesalePrice ?? product.sellPrice ?? 0),
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      products[index] = updated;
    } else {
      products.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notifyListeners(true);

    // Low egress upsert to Supabase with schema fault-tolerance
    safeAsync(
      (async () => {
        const { error } = await supabase.from('products').upsert({
          id: updated.id,
          barcode: updated.barcode,
          name: updated.name,
          category: updated.category,
          buy_price: updated.buyPrice,
          sell_price: updated.sellPrice,
          wholesale_price: updated.wholesalePrice,
          stock: updated.stock,
          min_stock: updated.minStock,
          photo_url: updated.photoUrl,
          unit: updated.unit,
          created_at: updated.createdAt,
          updated_at: updated.updatedAt,
        });

        // If wholesale_price column does not exist in Supabase table yet, retry without it
        if (error && error.message && error.message.includes('wholesale_price')) {
          await supabase.from('products').upsert({
            id: updated.id,
            barcode: updated.barcode,
            name: updated.name,
            category: updated.category,
            buy_price: updated.buyPrice,
            sell_price: updated.sellPrice,
            stock: updated.stock,
            min_stock: updated.minStock,
            photo_url: updated.photoUrl,
            unit: updated.unit,
            created_at: updated.createdAt,
            updated_at: updated.updatedAt,
          });
        }
      })()
    );

    return updated;
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notifyListeners(true);
    safeAsync(supabase.from('products').delete().eq('id', id));
  }

  updateStock(productId: string, quantityToDeduct: number): boolean {
    const products = this.getProducts();
    const item = products.find((p) => p.id === productId);
    if (!item) return false;

    item.stock = Math.max(0, item.stock - quantityToDeduct);
    item.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notifyListeners(true);

    safeAsync(
      supabase.from('products').update({
        stock: item.stock,
        updated_at: item.updatedAt,
      }).eq('id', productId)
    );

    return true;
  }

  // --- USERS & AUTH ---
  getUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      const list: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;
      return list.map((u) => ({
        ...u,
        customerType: u.customerType || 'general',
        status: u.status || (u.role === 'admin' ? 'approved' : 'approved'),
      }));
    } catch {
      return INITIAL_USERS;
    }
  }

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notifyListeners(false);
  }

  saveUser(user: User): User {
    const userToSave: User = {
      ...user,
      customerType: user.customerType || 'general',
      status: user.status || (user.role === 'admin' ? 'approved' : 'pending'),
    };
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userToSave.id || u.email.toLowerCase() === userToSave.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...userToSave };
    } else {
      users.push(userToSave);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyListeners(true);

    safeAsync(
      supabase.from('users').upsert({
        id: userToSave.id,
        name: userToSave.name,
        email: userToSave.email,
        role: userToSave.role,
        customer_type: userToSave.customerType || 'general',
        phone: userToSave.phone || null,
        address: userToSave.address || null,
        password_hash: userToSave.password || null,
        password: userToSave.password || null,
        status: userToSave.status,
        created_at: userToSave.createdAt,
      })
    );

    return userToSave;
  }

  updateCustomerStatus(userId: string, status: 'approved' | 'pending' | 'rejected'): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.status = status;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser({ ...current, status });
    } else {
      this.notifyListeners(true);
    }

    safeAsync(
      supabase.from('users').update({
        status: status,
      }).eq('id', userId)
    );

    return true;
  }

  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return false;

    // Safety: ensure at least one admin remains
    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return false;
      }
    }

    const filtered = users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(null);
    } else {
      this.notifyListeners();
    }

    safeAsync(supabase.from('users').delete().eq('id', userId));
    return true;
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders: Order[] = raw ? JSON.parse(raw) : INITIAL_ORDERS;
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_ORDERS;
    }
  }

  createOrder(order: Order): Order {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Deduct stock for all items in order
    order.items.forEach((item) => {
      this.updateStock(item.productId, item.quantity);
    });

    if (order.remainingDebt > 0) {
      this.createDebtRecord({
        id: 'debt-' + Date.now(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderId: order.id,
        source: 'pos',
        originalDebt: order.remainingDebt,
        remainingDebt: order.remainingDebt,
        status: 'unpaid',
        notes: `Hutang dari transaksi #${order.orderNumber}`,
        createdAt: new Date().toISOString(),
        payments: [],
      });
    }

    this.notifyListeners(true);

    // Sync to Supabase
    safeAsync(
      supabase.from('orders').insert({
        id: order.id,
        order_number: order.orderNumber,
        type: order.type,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_address: order.customerAddress,
        customer_type: order.customerType || 'general',
        items: order.items,
        subtotal: order.subtotal,
        total_discount: order.totalDiscount,
        total_amount: order.totalAmount,
        total_buy_cost: order.totalBuyCost,
        profit: order.profit,
        payment_method: order.paymentMethod,
        amount_paid: order.amountPaid,
        remaining_debt: order.remainingDebt,
        status: order.status,
        notes: order.notes,
        created_at: order.createdAt,
      })
    );

    return order;
  }

  updateOrder(updatedOrder: Order): Order {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index >= 0) {
      orders[index] = updatedOrder;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notifyListeners(true);

      safeAsync(
        supabase.from('orders').update({
          customer_name: updatedOrder.customerName,
          customer_phone: updatedOrder.customerPhone,
          customer_address: updatedOrder.customerAddress,
          customer_type: updatedOrder.customerType || 'general',
          payment_method: updatedOrder.paymentMethod,
          amount_paid: updatedOrder.amountPaid,
          remaining_debt: updatedOrder.remainingDebt,
          status: updatedOrder.status,
          notes: updatedOrder.notes,
          profit: updatedOrder.profit,
          total_amount: updatedOrder.totalAmount,
        }).eq('id', updatedOrder.id)
      );
    }
    return updatedOrder;
  }

  deleteOrder(orderId: string, restoreStock: boolean = true): boolean {
    const orders = this.getOrders();
    const orderToDelete = orders.find((o) => o.id === orderId);
    if (!orderToDelete) return false;

    if (restoreStock && orderToDelete.items && orderToDelete.items.length > 0) {
      const products = this.getProducts();
      orderToDelete.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
          this.saveProduct(prod);
        }
      });
    }

    const debts = this.getDebts();
    const associatedDebt = debts.find((d) => d.orderId === orderId);
    if (associatedDebt) {
      this.deleteDebt(associatedDebt.id);
    }

    const filtered = orders.filter((o) => o.id !== orderId);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
    this.notifyListeners(true);

    safeAsync(supabase.from('orders').delete().eq('id', orderId));
    return true;
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notifyListeners(true);
      safeAsync(supabase.from('orders').update({ status }).eq('id', orderId));
    }
  }

  // --- DEBTS ---
  getDebts(): DebtRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
      const debts: DebtRecord[] = raw ? JSON.parse(raw) : INITIAL_DEBTS;
      return debts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_DEBTS;
    }
  }

  createDebtRecord(debt: DebtRecord): DebtRecord {
    const debts = this.getDebts();
    debts.unshift(debt);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    this.notifyListeners(true);

    safeAsync(
      supabase.from('debts').insert({
        id: debt.id,
        customer_name: debt.customerName,
        customer_phone: debt.customerPhone,
        order_id: debt.orderId,
        source: debt.source,
        original_debt: debt.originalDebt,
        remaining_debt: debt.remainingDebt,
        status: debt.status,
        notes: debt.notes,
        payments: debt.payments,
        created_at: debt.createdAt,
      })
    );

    return debt;
  }

  payDebtInstallment(debtId: string, amount: number, notes?: string): DebtRecord | null {
    const debts = this.getDebts();
    const record = debts.find((d) => d.id === debtId);
    if (!record) return null;

    const paymentDate = new Date().toISOString();
    record.payments.push({
      id: 'pay-' + Date.now(),
      amount,
      date: paymentDate,
      notes: notes || 'Pembayaran angsuran',
    });

    record.remainingDebt = Math.max(0, record.remainingDebt - amount);
    record.lastPaymentDate = paymentDate;

    if (record.remainingDebt <= 0) {
      record.status = 'paid';
    } else {
      record.status = 'partial';
    }

    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    this.notifyListeners(true);

    safeAsync(
      supabase.from('debts').update({
        remaining_debt: record.remainingDebt,
        status: record.status,
        last_payment_date: record.lastPaymentDate,
        payments: record.payments,
      }).eq('id', debtId)
    );

    return record;
  }

  deleteDebt(debtId: string): void {
    const debts = this.getDebts().filter((d) => d.id !== debtId);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    this.notifyListeners(true);
    safeAsync(supabase.from('debts').delete().eq('id', debtId));
  }

  // --- EXTERNAL PROFITS & EXPENSES ---
  getProfits(): ExternalProfitRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFITS);
      const records: ExternalProfitRecord[] = raw ? JSON.parse(raw) : INITIAL_PROFITS;
      return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_PROFITS;
    }
  }

  createProfitRecord(record: ExternalProfitRecord): ExternalProfitRecord {
    const records = this.getProfits();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(records));
    this.notifyListeners(true);

    safeAsync(
      supabase.from('external_profits').insert({
        id: record.id,
        title: record.title,
        type: record.type,
        amount: record.amount,
        category: record.category,
        date: record.date,
        notes: record.notes,
        created_at: record.createdAt,
      })
    );

    return record;
  }

  deleteProfitRecord(id: string): void {
    const records = this.getProfits().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(records));
    this.notifyListeners(true);
    safeAsync(supabase.from('external_profits').delete().eq('id', id));
  }

  // --- MANUAL FULL SYNC TO SUPABASE ---
  async syncAllDataToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = this.getSettings();
      const products = this.getProducts();
      const users = this.getUsers();
      const orders = this.getOrders();
      const debts = this.getDebts();
      const profits = this.getProfits();

      // 1. Sync Settings
      await supabase.from('store_settings').upsert({
        id: 'default',
        app_name: settings.appName,
        store_name: settings.storeName,
        store_address: settings.storeAddress,
        store_phone: settings.storePhone,
        receipt_footer: settings.receiptFooter,
        dana_number: settings.danaNumber,
        dana_holder: settings.danaHolder,
        cod_enabled: settings.codEnabled,
        dana_enabled: settings.danaEnabled,
        qris_url: settings.qrisUrl,
        low_stock_threshold: settings.lowStockThreshold,
      });

      // 2. Sync Products
      if (products.length > 0) {
        const productRows = products.map((p) => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          category: p.category,
          buy_price: p.buyPrice,
          sell_price: p.sellPrice,
          wholesale_price: p.wholesalePrice ?? p.sellPrice ?? 0,
          stock: p.stock,
          min_stock: p.minStock,
          photo_url: p.photoUrl,
          unit: p.unit,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        }));
        await supabase.from('products').upsert(productRows);
      }

      // 3. Sync Users
      if (users.length > 0) {
        const userRows = users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          customer_type: u.customerType || 'general',
          phone: u.phone,
          address: u.address,
          password_hash: u.password || null,
          password: u.password || null,
          status: u.status || 'approved',
          created_at: u.createdAt,
        }));
        await supabase.from('users').upsert(userRows);
      }

      // 4. Sync Orders & Relational Order Items
      if (orders.length > 0) {
        const orderRows = orders.map((o) => ({
          id: o.id,
          order_number: o.orderNumber,
          type: o.type,
          customer_id: o.customerId || null,
          customer_name: o.customerName,
          customer_phone: o.customerPhone,
          customer_address: o.customerAddress,
          items: o.items,
          subtotal: o.subtotal,
          total_discount: o.totalDiscount,
          total_amount: o.totalAmount,
          total_buy_cost: o.totalBuyCost,
          profit: o.profit,
          payment_method: o.paymentMethod,
          amount_paid: o.amountPaid,
          remaining_debt: o.remainingDebt,
          status: o.status,
          notes: o.notes,
          created_at: o.createdAt,
        }));
        await supabase.from('orders').upsert(orderRows);

        // Relational order_items sync
        const allOrderItems: any[] = [];
        orders.forEach((o) => {
          if (Array.isArray(o.items)) {
            o.items.forEach((it, idx) => {
              allOrderItems.push({
                id: `${o.id}-item-${idx}`,
                order_id: o.id,
                product_id: it.productId || null,
                product_name: it.productName,
                barcode: it.barcode || null,
                category: it.category || null,
                buy_price: it.buyPrice || 0,
                sell_price: it.sellPrice || 0,
                quantity: it.quantity || 1,
                discount: it.discount || 0,
                subtotal: it.subtotal || 0,
                created_at: o.createdAt,
              });
            });
          }
        });

        if (allOrderItems.length > 0) {
          // Upsert order items silently if table exists
          try {
            await supabase.from('order_items').upsert(allOrderItems);
          } catch (e) {
            console.warn('order_items sync skipped or table pending creation:', e);
          }
        }
      }

      // 5. Sync Debts & Debt Payments
      if (debts.length > 0) {
        const debtRows = debts.map((d) => ({
          id: d.id,
          customer_name: d.customerName,
          customer_phone: d.customerPhone,
          order_id: d.orderId || null,
          source: d.source,
          original_debt: d.originalDebt,
          remaining_debt: d.remainingDebt,
          status: d.status,
          notes: d.notes,
          payments: d.payments,
          created_at: d.createdAt,
          last_payment_date: d.lastPaymentDate,
        }));
        await supabase.from('debts').upsert(debtRows);

        // Relational debt_payments sync
        const allPayments: any[] = [];
        debts.forEach((d) => {
          if (Array.isArray(d.payments)) {
            d.payments.forEach((pm) => {
              allPayments.push({
                id: pm.id,
                debt_id: d.id,
                amount: pm.amount,
                payment_date: pm.date,
                notes: pm.notes || null,
                created_at: pm.date,
              });
            });
          }
        });

        if (allPayments.length > 0) {
          try {
            await supabase.from('debt_payments').upsert(allPayments);
          } catch (e) {
            console.warn('debt_payments sync skipped:', e);
          }
        }
      }

      // 6. Sync Profits
      if (profits.length > 0) {
        const profitRows = profits.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          amount: p.amount,
          category: p.category,
          date: p.date,
          notes: p.notes,
          created_at: p.createdAt,
        }));
        await supabase.from('external_profits').upsert(profitRows);
      }

      return {
        success: true,
        message: `Sinkronisasi Sukses! ${products.length} produk, ${orders.length} transaksi & pengaturan berhasil diunggah ke Supabase.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal sinkron: ${err?.message || 'Pastikan tabel schema SQL sudah dijalankan di Supabase'}.`,
      };
    }
  }

  // --- BACKUP & RESTORE DATA (Database & Application) ---
  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      products: this.getProducts(),
      users: this.getUsers(),
      orders: this.getOrders(),
      debts: this.getDebts(),
      profits: this.getProfits(),
    };
    return JSON.stringify(backup, null, 2);
  }

  importFullBackup(jsonContent: string): boolean {
    try {
      const data = JSON.parse(jsonContent);
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.orders) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      if (data.debts) localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data.debts));
      if (data.profits) localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(data.profits));
      return true;
    } catch {
      return false;
    }
  }

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(INITIAL_DEBTS));
    localStorage.setItem(STORAGE_KEYS.PROFITS, JSON.stringify(INITIAL_PROFITS));
  }
}

export const storage = new StorageService();
