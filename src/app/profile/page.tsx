"use client";

import BottomNavigation from '@/components/layout/BottomNavigation';
import { FaUser, FaSignOutAlt, FaCog, FaInfoCircle, FaQuestionCircle, FaShieldAlt } from 'react-icons/fa';
import { useState } from 'react';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState({
    username: 'user123',
    telegramId: '@user123',
    joinDate: '2025-04-01',
    totalCoins: 1250.75,
    referrals: 12,
    completedTasks: 2
  });

  return (
    <div className="min-h-screen pb-20">
      {/* رأس الصفحة */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold gold-text">الملف الشخصي</h1>
      </header>

      {/* معلومات المستخدم */}
      <div className="p-4">
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-background-gray rounded-full flex items-center justify-center mr-4">
              <FaUser size={32} className="text-primary-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-sm text-gray-400">{user.telegramId}</p>
              <p className="text-xs text-gray-500">عضو منذ {new Date(user.joinDate).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-background-gray rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">العملات</p>
              <p className="text-lg font-bold gold-text">{user.totalCoins}</p>
            </div>
            <div className="bg-background-gray rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">الإحالات</p>
              <p className="text-lg font-bold gold-text">{user.referrals}</p>
            </div>
            <div className="bg-background-gray rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">المهام</p>
              <p className="text-lg font-bold gold-text">{user.completedTasks}/4</p>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الإعدادات */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">الإعدادات</h2>
          <div className="space-y-3">
            <button className="flex items-center justify-between w-full p-3 bg-background-gray rounded-lg">
              <div className="flex items-center">
                <FaCog className="text-primary-gold mr-3" size={18} />
                <span>إعدادات الحساب</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button className="flex items-center justify-between w-full p-3 bg-background-gray rounded-lg">
              <div className="flex items-center">
                <FaShieldAlt className="text-primary-gold mr-3" size={18} />
                <span>الأمان والخصوصية</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button className="flex items-center justify-between w-full p-3 bg-background-gray rounded-lg">
              <div className="flex items-center">
                <FaInfoCircle className="text-primary-gold mr-3" size={18} />
                <span>عن التطبيق</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button className="flex items-center justify-between w-full p-3 bg-background-gray rounded-lg">
              <div className="flex items-center">
                <FaQuestionCircle className="text-primary-gold mr-3" size={18} />
                <span>المساعدة والدعم</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* زر تسجيل الخروج */}
      <div className="p-4">
        <button className="secondary-button w-full">
          <FaSignOutAlt size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* شريط التنقل السفلي */}
      <BottomNavigation currentPath="/profile" />
    </div>
  );
}

