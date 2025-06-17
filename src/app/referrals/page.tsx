"use client";

import BottomNavigation from '@/components/layout/BottomNavigation';
import { FaUsers, FaLink, FaCoins } from 'react-icons/fa';
import Image from 'next/image';
import { useState } from 'react';

export default function ReferralsPage() {
  const [referralCount, setReferralCount] = useState(12);
  const [referralLink, setReferralLink] = useState("https://smartcoin.app/ref/user123");
  
  // جدول المكافآت
  const rewardTiers = [
    { count: 16, reward: "1$" },
    { count: 20, reward: "3$" },
    { count: 25, reward: "6$" },
    { count: 30, reward: "12$" },
    { count: 40, reward: "17$" },
    { count: 50, reward: "25$" },
    { count: 60, reward: "31$" },
  ];

  // العثور على المستوى التالي
  const getNextTier = () => {
    for (const tier of rewardTiers) {
      if (referralCount < tier.count) {
        return tier;
      }
    }
    return rewardTiers[rewardTiers.length - 1];
  };

  const nextTier = getNextTier();
  const progress = nextTier ? (referralCount / nextTier.count) * 100 : 100;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // يمكن إضافة إشعار هنا
  };

  return (
    <div className="min-h-screen pb-20">
      {/* رأس الصفحة */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold gold-text">الإحالات</h1>
      </header>

      {/* بطاقة الإحالات */}
      <div className="p-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">عدد الإحالات</h2>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-bold gold-text">{referralCount}</span>
                <Image 
                  src="/assets/smart-coin-logo.png" 
                  alt="Smart Coin" 
                  width={24} 
                  height={24} 
                  className="mr-2" 
                />
              </div>
            </div>
            <div className="bg-background-gray rounded-full p-3">
              <FaUsers size={24} className="text-primary-gold" />
            </div>
          </div>

          {nextTier && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>المستوى التالي: {nextTier.count} إحالة</span>
                <span className="gold-text">المكافأة: {nextTier.reward}</span>
              </div>
              <div className="referral-progress">
                <div 
                  className="referral-progress-bar" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                تحتاج إلى {nextTier.count - referralCount} إحالة إضافية للوصول للمستوى التالي
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-md font-bold mb-2">رابط الإحالة الخاص بك</h3>
            <div className="wallet-address">
              <span className="text-sm">{referralLink}</span>
              <button className="copy-button" onClick={copyReferralLink}>
                <FaLink size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              شارك هذا الرابط مع أصدقائك للحصول على مكافآت
            </p>
          </div>

          <button className="primary-button w-full mt-4">
            <FaLink size={16} />
            <span>مشاركة الرابط</span>
          </button>
        </div>
      </div>

      {/* جدول المكافآت */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">جدول المكافآت</h2>
          <div className="space-y-3">
            {rewardTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-3 rounded-lg ${
                  referralCount >= tier.count ? 'bg-background-gray' : 'bg-background-dark'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    referralCount >= tier.count ? 'bg-primary-gold text-background-black' : 'bg-background-gray text-gray-400'
                  }`}>
                    <FaUsers size={16} />
                  </div>
                  <span>{tier.count} إحالة</span>
                </div>
                <div className={`flex items-center ${
                  referralCount >= tier.count ? 'text-primary-gold' : 'text-gray-400'
                }`}>
                  <FaCoins size={14} className="mr-1" />
                  <span>{tier.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* شريط التنقل السفلي */}
      <BottomNavigation currentPath="/referrals" />
    </div>
  );
}

