CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE,
  username TEXT,
  wallet_address TEXT,
  balance DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_mining TIMESTAMP WITH TIME ZONE,
  mining_rate INTEGER DEFAULT 15,
  withdrawal_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER REFERENCES users(id),
  referred_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  task_type TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward INTEGER,
  UNIQUE(user_id, task_type)
);

CREATE TABLE mining_packages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price DECIMAL,
  daily_rate INTEGER,
  currency TEXT DEFAULT 'TON',
  is_one_time BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  package_id INTEGER REFERENCES mining_packages(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL,
  transaction_type TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

-- إدخال حزم التعدين الافتراضية
INSERT INTO mining_packages (name, price, daily_rate, currency, is_one_time) VALUES
('حزمة التعدين الأساسية', 0.1, 60, 'TON', FALSE),
('حزمة التعدين المتوسطة', 0.3, 90, 'TON', FALSE),
('حزمة التعدين المتقدمة', 0.5, 200, 'TON', FALSE),
('شراء مباشر للعملات', 0.1, 3000, 'TON', TRUE);

-- إنشاء دالة لتحديث حالة السحب بعد 37 يوم
CREATE OR REPLACE FUNCTION update_withdrawal_status() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.created_at + INTERVAL '37 days') <= NOW() THEN
    NEW.withdrawal_enabled = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_withdrawal_eligibility
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_withdrawal_status();
