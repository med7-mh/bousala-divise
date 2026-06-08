-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER');
    CREATE TYPE transaction_type AS ENUM ('BUY', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Drop existing tables if they exist to apply new schema safely
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.currencies CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. Create Tables
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'ADMIN' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.currencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name TEXT NOT NULL,
    is_local_base BOOLEAN DEFAULT FALSE,
    balance NUMERIC(15, 4) DEFAULT 0.0 CHECK (balance >= 0),
    average_cost NUMERIC(15, 6) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, code) -- Each user has unique currency codes
);

CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    txn_type transaction_type NOT NULL,
    currency_id UUID REFERENCES public.currencies(id) ON DELETE RESTRICT NOT NULL,
    foreign_amount NUMERIC(15, 4) NOT NULL CHECK (foreign_amount > 0),
    exchange_rate NUMERIC(15, 6) NOT NULL CHECK (exchange_rate > 0),
    local_amount NUMERIC(15, 4) NOT NULL CHECK (local_amount > 0), 
    reference_cost NUMERIC(15, 6) NOT NULL DEFAULT 0.0,
    profit NUMERIC(15, 4) NOT NULL DEFAULT 0.0,
    customer_name TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Auto User Profile and Default Currencies Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.email, 'User'), 'ADMIN');
  
  -- Insert default currencies with ZERO balance for the new user
  INSERT INTO public.currencies (user_id, code, name, is_local_base, balance, average_cost)
  VALUES 
    (new.id, 'MRU', 'الأوقية الموريتانية (MRU)', TRUE, 0.0, 1.0),
    (new.id, 'USD', 'الدولار الأمريكي (USD)', FALSE, 0.0, 0.0),
    (new.id, 'EUR', 'اليورو الأوروبي (EUR)', FALSE, 0.0, 0.0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. Business Logic Function (Process Transaction)
CREATE OR REPLACE FUNCTION process_currency_transaction(
    p_user_id UUID,
    p_txn_type transaction_type,
    p_currency_id UUID,
    p_foreign_amount NUMERIC,
    p_exchange_rate NUMERIC,
    p_customer_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_local_currency_id UUID;
    v_local_balance NUMERIC;
    v_foreign_code VARCHAR(10);
    v_foreign_balance NUMERIC;
    v_foreign_avg_cost NUMERIC;
    v_local_amount_calc NUMERIC;
    v_profit NUMERIC := 0.0;
    v_new_transaction_id UUID;
BEGIN
    SELECT id, balance INTO v_local_currency_id, v_local_balance 
    FROM public.currencies WHERE is_local_base = TRUE AND user_id = p_user_id LIMIT 1;
    
    IF v_local_currency_id IS NULL THEN
        RAISE EXCEPTION 'العملة المحلية غير موجودة لحسابك.';
    END IF;

    SELECT code, balance, average_cost INTO v_foreign_code, v_foreign_balance, v_foreign_avg_cost 
    FROM public.currencies WHERE id = p_currency_id AND user_id = p_user_id FOR UPDATE;
    
    IF v_foreign_code IS NULL THEN
        RAISE EXCEPTION 'العملة الأجنبية غير صحيحة.';
    END IF;

    v_local_amount_calc := p_foreign_amount * p_exchange_rate;

    IF p_txn_type = 'BUY' THEN
        IF v_local_balance < v_local_amount_calc THEN
            RAISE EXCEPTION 'رصيد الخزنة من العملة المحلية لا يكفي لإتمام الشراء.';
        END IF;
        
        DECLARE
           v_new_total_cost NUMERIC;
           v_new_total_amount NUMERIC;
        BEGIN
           v_new_total_cost := (v_foreign_balance * v_foreign_avg_cost) + v_local_amount_calc;
           v_new_total_amount := v_foreign_balance + p_foreign_amount;
           v_foreign_avg_cost := v_new_total_cost / v_new_total_amount;
        END;

        UPDATE public.currencies SET balance = balance - v_local_amount_calc WHERE id = v_local_currency_id;
        UPDATE public.currencies SET balance = balance + p_foreign_amount, average_cost = v_foreign_avg_cost WHERE id = p_currency_id;
        
        v_profit := 0.0;
        
    ELSIF p_txn_type = 'SELL' THEN
        IF v_foreign_balance < p_foreign_amount THEN
            RAISE EXCEPTION 'رصيد الخزنة من عملة % لا يكفي.', v_foreign_code;
        END IF;

        v_profit := (p_exchange_rate - v_foreign_avg_cost) * p_foreign_amount;
        
        UPDATE public.currencies SET balance = balance + v_local_amount_calc WHERE id = v_local_currency_id;
        UPDATE public.currencies SET balance = balance - p_foreign_amount WHERE id = p_currency_id;
    END IF;

    INSERT INTO public.transactions (
        user_id, txn_type, currency_id, foreign_amount, exchange_rate, 
        local_amount, reference_cost, profit, customer_name, created_by
    ) VALUES (
        p_user_id, p_txn_type, p_currency_id, p_foreign_amount, p_exchange_rate, 
        v_local_amount_calc, v_foreign_avg_cost, v_profit, p_customer_name, p_user_id
    ) RETURNING id INTO v_new_transaction_id;

    RETURN v_new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to Reverse (Delete) a Transaction Safely
CREATE OR REPLACE FUNCTION reverse_currency_transaction(
    p_txn_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_txn RECORD;
    v_local_currency_id UUID;
BEGIN
    SELECT * INTO v_txn FROM public.transactions WHERE id = p_txn_id AND user_id = p_user_id;
    IF v_txn IS NULL THEN
       RAISE EXCEPTION 'Operation not found or unauthorized.';
    END IF;

    SELECT id INTO v_local_currency_id FROM public.currencies WHERE is_local_base = TRUE AND user_id = p_user_id LIMIT 1;
    
    IF v_txn.txn_type = 'BUY' THEN
        UPDATE public.currencies SET balance = balance + v_txn.local_amount WHERE id = v_local_currency_id;
        UPDATE public.currencies SET balance = balance - v_txn.foreign_amount WHERE id = v_txn.currency_id;
    ELSIF v_txn.txn_type = 'SELL' THEN
        UPDATE public.currencies SET balance = balance - v_txn.local_amount WHERE id = v_local_currency_id;
        UPDATE public.currencies SET balance = balance + v_txn.foreign_amount WHERE id = v_txn.currency_id;
    END IF;

    DELETE FROM public.transactions WHERE id = p_txn_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
