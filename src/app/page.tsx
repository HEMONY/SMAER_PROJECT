'use client'
import { useEffect, useState } from 'react';
import { FaCoins, FaRocket, FaUsers, FaChartLine } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import BottomNavigation from '@/components/layout/BottomNavigation';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    balance: 0,
    dailyMining: 15,
    referrals: 0,
    totalEarned: 0
  });

  // محاكاة التحقق من تسجيل الدخول
  useEffect(() => {
    // في التطبيق الحقيقي، سيتم التحقق من حالة تسجيل الدخول من الخادم
    const checkLoginStatus = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(isLoggedIn);
      
      if (isLoggedIn) {
        // محاكاة جلب بيانات المستخدم
        setStats({
          balance: 250,
          dailyMining: 15,
          referrals: 3,
          totalEarned: 450
        });
      }
    };
    
    checkLoginStatus();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* رأس الصفحة */}
      <header className="p-4 text-center">
        <Image 
          src="/assets/smart-coin-logo.png" 
          alt="Smart Coin" 
          width={80} 
          height={80} 
          className="mx-auto mb-2"
        />
        <h1 className="text-2xl font-bold gold-text">Smart Coin</h1>
        <p className="text-gray-400">منصة التعدين الذكية</p>
      </header>

      {isLoggedIn ? (
        // واجهة المستخدم المسجل
        <div className="p-4 space-y-6">
          {/* بطاقة الرصيد */}
          <div className="card bg-gradient-to-r from-primary-gold/20 to-primary-gold/5 border border-primary-gold/30">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg text-gray-300">رصيدك الحالي</h2>
                <p className="text-3xl font-bold gold-text flex items-center">
                  <FaCoins className="inline mr-2" />
                  {stats.balance}
                </p>
              </div>
              <Link href="/wallet" className="primary-button">
                سحب الرصيد
              </Link>
            </div>
          </div>

          {/* بطاقة التعدين اليومي */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">التعدين اليومي</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400">معدل التعدين اليومي</p>
                <p className="text-xl font-bold gold-text flex items-center">
                  <FaCoins className="inline mr-2" />
                  {stats.dailyMining} / يوم
                </p>
              </div>
              <Link href="/store" className="secondary-button">
                <FaRocket className="mr-2" />
                تعزيز التعدين
              </Link>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex flex-col items-center">
                <FaUsers className="text-primary-gold text-2xl mb-2" />
                <p className="text-gray-400">الإحالات</p>
                <p className="text-xl font-bold gold-text">{stats.referrals}</p>
              </div>
            </div>
            <div className="card">
              <div className="flex flex-col items-center">
                <FaChartLine className="text-primary-gold text-2xl mb-2" />
                <p className="text-gray-400">إجمالي المكتسبات</p>
                <p className="text-xl font-bold gold-text">{stats.totalEarned}</p>
              </div>
            </div>
          </div>

          {/* أحدث الأخبار */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">أحدث الأخبار</h2>
            <div className="space-y-4">
              <div className="border-b border-gray-700 pb-3">
                <h3 className="font-medium">إطلاق تحديث جديد للمنصة</h3>
                <p className="text-sm text-gray-400">تم إضافة ميزات جديدة لزيادة معدلات التعدين</p>
                <p className="text-xs text-gray-500 mt-1">منذ 2 يوم</p>
              </div>
              <div>
                <h3 className="font-medium">عرض خاص: مضاعفة المكافآت</h3>
                <p className="text-sm text-gray-400">احصل على مكافآت مضاعفة عند إكمال المهام هذا الأسبوع</p>
                <p className="text-xs text-gray-500 mt-1">منذ 5 أيام</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // واجهة الزائر
        <div className="p-4 space-y-6">
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-4">مرحباً بك في منصة Smart Coin</h2>
            <p className="text-gray-400 mb-6">
              منصة Smart Coin هي منصة تعدين ذكية تتيح لك كسب العملات الرقمية بسهولة من خلال إكمال المهام البسيطة ودعوة الأصدقاء.
            </p>
            <div className="space-y-4">
              <Link href="/login" className="primary-button w-full">
                تسجيل الدخول
              </Link>
              <div className="flex items-center justify-center">
                <span className="text-gray-500">ليس لديك حساب؟</span>
                <Link href="/login" className="text-primary-gold mr-2">
                  إنشاء حساب
                </Link>
              </div>
            </div>
          </div>

          {/* مميزات المنصة */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 text-center">مميزات المنصة</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary-gold/20 p-2 rounded-full ml-3">
                  <FaCoins className="text-primary-gold" />
                </div>
                <div>
                  <h3 className="font-medium">تعدين يومي</h3>
                  <p className="text-sm text-gray-400">احصل على 15 عملة يومياً مجاناً</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary-gold/20 p-2 rounded-full ml-3">
                  <FaUsers className="text-primary-gold" />
                </div>
                <div>
                  <h3 className="font-medium">برنامج الإحالة</h3>
                  <p className="text-sm text-gray-400">اكسب عملات إضافية عند دعوة أصدقائك</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary-gold/20 p-2 rounded-full ml-3">
                  <FaRocket className="text-primary-gold" />
                </div>
                <div>
                  <h3 className="font-medium">معززات التعدين</h3>
                  <p className="text-sm text-gray-400">اشترِ معززات لزيادة معدل التعدين اليومي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شريط التنقل السفلي */}
      <BottomNavigation currentPath="/" />
    </div>
  );
}
