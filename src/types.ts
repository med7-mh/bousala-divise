export type UserRole = 'ADMIN' | 'CASHIER';
export type TransactionType = 'BUY' | 'SELL';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: string;
  user_id?: string;
  code: string;
  name: string;
  is_local_base: boolean;
  balance: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  txn_type: TransactionType;
  currency_id: string;
  foreign_amount: number;
  exchange_rate: number;
  local_amount: number;
  reference_cost: number;
  profit: number;
  customer_name?: string;
  created_by?: string;
  created_at: string;
}
