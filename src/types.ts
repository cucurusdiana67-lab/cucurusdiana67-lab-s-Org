export type Role = 'admin' | 'customer';
export type CustomerStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  password?: string;
  status?: CustomerStatus;
  createdAt: string;
}

export interface StoreSettings {
  appName: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  danaNumber: string;
  danaHolder: string;
  codEnabled: boolean;
  danaEnabled: boolean;
  qrisUrl?: string;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  photoUrl: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discount?: number;
}

export type PaymentMethod = 'cash' | 'debt_partial' | 'debt_full' | 'dana' | 'cod';
export type OrderType = 'online' | 'pos';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  barcode?: string;
  category?: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  subtotal: number;
  discount?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  totalBuyCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  remainingDebt: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface DebtRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
  source: 'pos' | 'external';
  originalDebt: number;
  remainingDebt: number;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  createdAt: string;
  lastPaymentDate?: string;
  payments: DebtPayment[];
}

export interface ExternalProfitRecord {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'storefront'
  | 'cart'
  | 'admin-pos'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-reports'
  | 'admin-profit'
  | 'admin-debts'
  | 'admin-restock'
  | 'admin-settings'
  | 'admin-admins'
  | 'admin-customers'
  | 'user-profile';

