'use client';

import { useState, useEffect } from 'react';
import { startMining } from '@/lib/supabase/client-api';
import { FaCoins, FaInfoCircle } from 'react-icons/fa';
import BottomNavigation from '@/components/layout/BottomNavigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
  const [miningAvailable, setMiningAvailable] = useState(true);
  const [miningLoading, setMiningLoading] = useState(false);
  const [miningError, setMiningError] = useState(null);
  const [countdown, setCountdown] = useState({
    days: 34,
    hours: 23,
    minutes: 59,
    seconds: 53
  });
  const [nextMiningTime, setNextMiningTime] = useState(null);
  const [user, setUser] = useState(null);
  
  // محاكاة جلب بيانات المستخدم
  useEffect(() => {
    const storedUser = localStorage.getItem('smartCoinUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // التحقق من وقت آخر تعدين
    const lastMiningTime = localStorage.getItem('lastMiningTime');
    if (lastMiningTime) {
      const lastTime = new Date(lastMiningTime);
      const now = new Date();
      const timeDiff = now.getTime() - lastTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setMiningAvailable(false);
        
        // حساب الوقت المتبقي للتعدين التالي
        const nextTime = new Date(lastTime.getTime() + 24 * 60 * 60 * 1000);
        setNextMiningTime(nextTime);
        
        // بدء العد التنازلي
        startCountdown(nextTime);
      }
    }
  }, []);
  
  // وظيفة العد التنازلي
  const startCountdown = (targetTime) => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime - now;
      
      if (diff <= 0) {
        clearInterval(interval);
        setMiningAvailable(true);
        setNextMiningTime(null);
        return;
      }
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({
        days: 0,
        hours,
        minutes,
        seconds
      });
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  const handleStartMining = async () => {
    if (!miningAvailable || miningLoading) return;
    
    setMiningLoading(true);
    setMiningError(null);
    
    try {
      // في التطبيق الحقيقي، هنا سنرسل طلب للخادم لتسجيل عملية التعدين
      // const { data, error } = await startMining();
      // if (error) throw error;
      
      // محاكاة استجابة الخادم
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // تخزين وقت آخر تعدين في التخزين المحلي
      const now = new Date();
      localStorage.setItem('lastMiningTime', now.toISOString());
      
      // حساب وقت التعدين التالي
      const nextTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setNextMiningTime(nextTime);
      
      // بدء العد التنازلي
      startCountdown(nextTime);
      
      setMiningAvailable(false);
    } catch (error) {
      console.error('خطأ في بدء التعدين:', error);
      setMiningError(error.message || 'حدث خطأ أثناء بدء التعدين');
    } finally {
      setMiningLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-20">
      {/* رأس الصفحة */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold gold-text">Smart Coin</h1>
      </header>
      
      {/* العداد التنازلي */}
      <div className="p-4">
        <div className="countdown-container">
          <div className="countdown-item">
            <div className="countdown-value">{countdown.days}</div>
            <div className="countdown-label">يوم</div>
          </div>
          <div className="countdown-item">
            <div className="countdown-value">{countdown.hours}</div>
            <div className="countdown-label">ساعة</div>
          </div>
          <div className="countdown-item">
            <div className="countdown-value">{countdown.minutes}</div>
            <div className="countdown-label">دقيقة</div>
          </div>
          <div className="countdown-item">
            <div className="countdown-value">{countdown.seconds}</div>
            <div className="countdown-label">ثانية</div>
          </div>
        </div>
      </div>
      
      {/* رسم بياني لنمو العملة */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-right">نمو العملة المتوقع</h2>
          <div className="h-64 relative">
            {/* هنا سيكون الرسم البياني في التطبيق الفعلي */}
            <div className="absolute bottom-0 right-0 w-full h-px bg-gray-700"></div>
            <div className="absolute right-0 top-0 h-full w-px bg-gray-700"></div>
            
            {/* نقاط البيانات */}
            <div className="absolute bottom-0 right-[5%] h-[5%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[20%] h-[10%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[35%] h-[20%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[50%] h-[35%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[65%] h-[50%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[80%] h-[75%] w-2 h-2 rounded-full bg-primary-gold"></div>
            <div className="absolute bottom-0 right-[95%] h-[95%] w-2 h-2 rounded-full bg-primary-gold"></div>
            
            {/* خط الرسم البياني */}
            <svg className="absolute inset-0 w-full h-full">
              <path 
                d="M 5% 95% L 20% 90% L 35% 80% L 50% 65% L 65% 50% L 80% 25% L 95% 5%" 
                fill="none" 
                stroke="#FFD700" 
                strokeWidth="2"
              />
            </svg>
            
            {/* تسميات المحور السيني */}
            <div className="absolute bottom-[-20px] right-[5%] text-xs text-gray-500">الآن</div>
            <div className="absolute bottom-[-20px] right-[20%] text-xs text-gray-500">الإطلاق</div>
            <div className="absolute bottom-[-20px] right-[35%] text-xs text-gray-500">شهر 1</div>
            <div className="absolute bottom-[-20px] right-[50%] text-xs text-gray-500">شهر 2</div>
            <div className="absolute bottom-[-20px] right-[65%] text-xs text-gray-500">شهر 3</div>
            <div className="absolute bottom-[-20px] right-[80%] text-xs text-gray-500">شهر 6</div>
            <div className="absolute bottom-[-20px] right-[95%] text-xs text-gray-500">سنة 1</div>
          </div>
        </div>
      </div>
      
      {/* زر بدء التعدين */}
      <div className="p-4 flex flex-col items-center">
        <button 
          className={`mining-button ${!miningAvailable || miningLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleStartMining}
          disabled={!miningAvailable || miningLoading}
        >
          {miningLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري التعدين...
            </span>
          ) : (
            <>
              <FaCoins size={24} />
              <span>ابدأ الآن</span>
            </>
          )}
        </button>
        
        {!miningAvailable && nextMiningTime && (
          <p className="text-sm text-gray-400 mt-2">
            يمكنك التعدين مرة أخرى بعد {countdown.hours} ساعة و {countdown.minutes} دقيقة
          </p>
        )}
        
        {miningError && (
          <p className="text-sm text-error-color mt-2">
            {miningError}
          </p>
        )}
        
        <Link href="/about" className="mt-6 secondary-button">
          <FaInfoCircle size={18} />
          <span>تعرف على المزيد</span>
        </Link>
      </div>
      
      {/* شريط التنقل السفلي */}
      <BottomNavigation currentPath="/dashboard" />
    </div>
  );
}
