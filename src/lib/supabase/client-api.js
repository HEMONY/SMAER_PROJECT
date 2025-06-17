import { createClient } from '@supabase/supabase-js';

// إعداد عميل Supabase للاستخدام في المتصفح
const supabaseUrl = 'https://aqunpkwwvslnmuqvotyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdW5wa3d3dnNsbm11cXZvdHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDAyODQsImV4cCI6MjA2MTAxNjI4NH0.FgbKG2DyKL7Ob6fIfwaC43_jAphP7YG2D61IgIIVHpo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// وظائف المصادقة
export async function signInWithTelegram(telegramData) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'telegram',
    options: {
      queryParams: {
        auth_date: telegramData.auth_date,
        hash: telegramData.hash,
        id: telegramData.id,
        first_name: telegramData.first_name,
        username: telegramData.username,
      },
    },
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// وظائف المستخدم
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error };
  }

  // الحصول على بيانات المستخدم من جدول المستخدمين
  const { data, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', user.id)
    .single();

  return { user: data, error: profileError };
}

// وظائف التعدين
export async function startMining() {
  const { data, error } = await supabase
    .functions.invoke('start-mining');
  
  return { data, error };
}

// وظائف المحفظة
export async function getUserBalance() {
  const { user, error: userError } = await getCurrentUser();
  
  if (userError || !user) {
    return { balance: 0, error: userError };
  }

  return { balance: user.balance, error: null };
}

// وظائف المتجر
export async function getStoreItems() {
  const { data, error } = await supabase
    .from('mining_packages')
    .select('*');
  
  return { items: data, error };
}

export async function purchasePackage(packageId) {
  const { data, error } = await supabase
    .functions.invoke('purchase-package', {
      body: { packageId },
    });
  
  return { data, error };
}

// وظائف الإحالات
export async function getReferralLink() {
  const { user, error: userError } = await getCurrentUser();
  
  if (userError || !user) {
    return { link: '', error: userError };
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartcoin.app';
  return { link: `${baseUrl}/ref/${user.id}`, error: null };
}

export async function getReferralCount() {
  const { data, error } = await supabase
    .functions.invoke('get-referral-count');
  
  return { count: data?.count || 0, error };
}

// وظائف المهام
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      users!inner(id)
    `)
    .eq('users.id', 'auth.uid');
  
  return { tasks: data, error };
}

export async function completeTask(taskType) {
  const { data, error } = await supabase
    .functions.invoke('complete-task', {
      body: { taskType },
    });
  
  return { data, error };
}

// وظائف TON Payments
export async function generateTONPaymentLink(packageId) {
  // في التطبيق الحقيقي، هذا سيولد رابط دفع TON
  // هنا نقوم بمحاكاة ذلك
  const { items, error } = await getStoreItems();
  
  if (error) {
    return { link: '', error };
  }
  
  const selectedPackage = items.find(item => item.id === packageId);
  
  if (!selectedPackage) {
    return { link: '', error: 'الحزمة غير موجودة' };
  }
  
  // محاكاة رابط الدفع
  return { 
    link: `ton://transfer/EQCcR3-I9mfJ8O_1vIuI80NSx6V?amount=${selectedPackage.price * 1000000000}&text=SmartCoin_Package_${packageId}`, 
    error: null 
  };
}

export async function verifyTONPayment(txHash) {
  // في التطبيق الحقيقي، هذا سيتحقق من معاملة TON
  // هنا نقوم بمحاكاة ذلك
  return { verified: true, error: null };
}
