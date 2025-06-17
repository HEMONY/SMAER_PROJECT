import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// --- Telegram API Credentials ---
// !!! SECURITY WARNING: Move these to environment variables (.env file) !!!
const TELEGRAM_API_ID = '20942401'; // Provided by user
const TELEGRAM_BOT_TOKEN = '7808906118:AAGw3YsXONFdYk8t1hlvCgnCm-8alIGpFtk'; // Provided by user

// إعداد عميل Supabase
const supabaseUrl = 'https://aqunpkwwvslnmuqvotyl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdW5wa3d3dnNsbm11cXZvdHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0MDI4NCwiZXhwIjoyMDYxMDE2Mjg0fQ.CNRePcC73D5f6jq1PKDxYB95gDLvhfZwDXILlfD-huw';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// التحقق من صحة بيانات تيليغرام
// Reference: https://core.telegram.org/widgets/login#checking-authorization
function verifyTelegramData(data) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.error('Telegram Bot Token is not configured!');
    return false; // Fail verification if token is missing
  }

  const receivedHash = data.hash;
  if (!receivedHash) {
    return false;
  }

  const dataCheckString = Object.keys(data)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  try {
    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Check if data is outdated (e.g., older than 1 day)
    const authDate = parseInt(data.auth_date, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) { // 86400 seconds = 1 day
        console.warn("Telegram data is outdated.");
        return false;
    }

    return calculatedHash === receivedHash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    // The Telegram widget sends data via query parameters on GET request, not POST body
    // Let's adjust to handle GET request and query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // التحقق من صحة البيانات
    if (!verifyTelegramData(queryParams)) {
      console.warn('Telegram data verification failed.');
      // Redirect back to login with an error message
      const errorUrl = new URL('/login?error=telegram_auth_failed', request.url);
      return NextResponse.redirect(errorUrl.toString(), 302);
    }

    const telegramUserData = queryParams;

    // البحث عن المستخدم في قاعدة البيانات
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUserData.id)
      .single();

    // إذا لم يكن المستخدم موجودًا، قم بإنشائه
    if (error && error.code === 'PGRST116') {
      const walletAddress = generateWalletAddress();

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            telegram_id: telegramUserData.id,
            username: telegramUserData.username || `user${telegramUserData.id}`,
            wallet_address: walletAddress,
            first_name: telegramUserData.first_name, // Store first name if available
            last_name: telegramUserData.last_name,   // Store last name if available
            photo_url: telegramUserData.photo_url    // Store photo url if available
          }
        ])
        .select()
        .single(); // Expecting a single new user

      if (createError) {
        console.error('Supabase insert error:', createError);
        const errorUrl = new URL('/login?error=user_creation_failed', request.url);
        return NextResponse.redirect(errorUrl.toString(), 302);
      }

      user = newUser;
    } else if (error) {
      console.error('Supabase select error:', error);
      const errorUrl = new URL('/login?error=database_error', request.url);
      return NextResponse.redirect(errorUrl.toString(), 302);
    } else {
      // Optional: Update existing user data if needed (e.g., username, photo_url)
      const updates = {};
      if (telegramUserData.username && user.username !== telegramUserData.username) updates.username = telegramUserData.username;
      if (telegramUserData.first_name && user.first_name !== telegramUserData.first_name) updates.first_name = telegramUserData.first_name;
      if (telegramUserData.last_name && user.last_name !== telegramUserData.last_name) updates.last_name = telegramUserData.last_name;
      if (telegramUserData.photo_url && user.photo_url !== telegramUserData.photo_url) updates.photo_url = telegramUserData.photo_url;

      if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
              .from('users')
              .update(updates)
              .eq('id', user.id);
          if (updateError) {
              console.error('Supabase update error:', updateError);
              // Continue even if update fails, login is still successful
          }
      }
    }

    // --- Session Handling ---
    // We need to create a session for the user. Since this is server-side,
    // we might need to use Supabase admin functions or handle JWTs.
    // For now, let's assume Supabase handles cookies if configured correctly.
    // Redirecting should allow the client-side Supabase client to pick up the session.

    // Redirect to dashboard upon successful login/signup
    const redirectUrl = new URL('/dashboard', request.url);
    // We might need to set cookies here if Supabase doesn't do it automatically
    // based on the redirect from Telegram widget.
    // This part requires careful handling of Supabase auth flow.
    // For now, just redirect.
    return NextResponse.redirect(redirectUrl.toString(), 302);


  } catch (error) {
    console.error('Server error:', error);
    const errorUrl = new URL('/login?error=server_error', request.url); // Redirect back to login with error
    return NextResponse.redirect(errorUrl.toString(), 302);
  }
}

// Add a GET handler since Telegram widget uses GET for callback
export async function GET(request) {
    // Reuse the POST logic, as the data comes in query params for GET
    return await POST(request);
}


// توليد عنوان محفظة عشوائي (Consider a more robust method for production)
function generateWalletAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'EQC'; // Example prefix
  for (let i = 0; i < 45; i++) { // Longer address
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

