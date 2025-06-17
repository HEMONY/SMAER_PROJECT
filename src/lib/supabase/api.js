import { createClient } from '@supabase/supabase-js';

// إعداد عميل Supabase
const supabaseUrl = 'https://aqunpkwwvslnmuqvotyl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdW5wa3d3dnNsbm11cXZvdHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0MDI4NCwiZXhwIjoyMDYxMDE2Mjg0fQ.CNRePcC73D5f6jq1PKDxYB95gDLvhfZwDXILlfD-huw';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// وظائف إدارة المستخدمين
export async function createUser(telegramId, username) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([
      { telegram_id: telegramId, username: username, wallet_address: generateWalletAddress() }
    ])
    .select();

  if (error) throw error;
  return data[0];
}

export async function getUserByTelegramId(telegramId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// وظائف التعدين
export async function performMining(userId) {
  // التحقق من آخر عملية تعدين
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('last_mining, mining_rate')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const now = new Date();
  const lastMining = user.last_mining ? new Date(user.last_mining) : null;

  // التحقق مما إذا كان قد مر 24 ساعة منذ آخر تعدين
  if (lastMining && (now - lastMining) < 24 * 60 * 60 * 1000) {
    throw new Error('لا يمكنك التعدين إلا مرة واحدة كل 24 ساعة');
  }

  // تحديث رصيد المستخدم وتاريخ آخر تعدين
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ 
      balance: supabaseAdmin.rpc('increment_balance', { amount: user.mining_rate }),
      last_mining: now.toISOString()
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data[0];
}

// وظائف الإحالات
export async function createReferral(referrerId, referredId) {
  const { data, error } = await supabaseAdmin
    .from('referrals')
    .insert([
      { referrer_id: referrerId, referred_id: referredId }
    ]);

  if (error) throw error;
  return data;
}

export async function getReferralCount(userId) {
  const { count, error } = await supabaseAdmin
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId);

  if (error) throw error;
  return count;
}

// وظائف المهام
export async function completeTask(userId, taskType, reward) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert([
      { user_id: userId, task_type: taskType, completed: true, completed_at: new Date().toISOString(), reward }
    ]);

  if (error) throw error;

  // إضافة المكافأة إلى رصيد المستخدم
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .update({ 
      balance: supabaseAdmin.rpc('increment_balance', { amount: reward })
    })
    .eq('id', userId)
    .select();

  if (userError) throw userError;
  return data;
}

// وظائف حزم التعدين
export async function purchasePackage(userId, packageId) {
  const { data: packageData, error: packageError } = await supabaseAdmin
    .from('mining_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (packageError) throw packageError;

  let expiresAt = null;
  if (!packageData.is_one_time) {
    // إذا كانت الحزمة مستمرة، تنتهي بعد 30 يومًا
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    expiresAt = expiry.toISOString();
  }

  // إنشاء حزمة للمستخدم
  const { data, error } = await supabaseAdmin
    .from('user_packages')
    .insert([
      { user_id: userId, package_id: packageId, expires_at: expiresAt }
    ]);

  if (error) throw error;

  // إذا كانت حزمة لمرة واحدة، أضف العملات مباشرة
  if (packageData.is_one_time) {
    await supabaseAdmin
      .from('users')
      .update({ 
        balance: supabaseAdmin.rpc('increment_balance', { amount: packageData.daily_rate })
      })
      .eq('id', userId);
  } else {
    // إذا كانت حزمة مستمرة، قم بتحديث معدل التعدين اليومي
    await supabaseAdmin
      .from('users')
      .update({ mining_rate: packageData.daily_rate })
      .eq('id', userId);
  }

  return data;
}

// وظائف المعاملات
export async function createTransaction(userId, amount, type, details = {}) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert([
      { 
        user_id: userId, 
        amount, 
        transaction_type: type, 
        status: 'completed', 
        details 
      }
    ]);

  if (error) throw error;
  return data;
}

// وظائف مساعدة
function generateWalletAddress() {
  // توليد عنوان محفظة عشوائي للعرض فقط
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'EQC';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
