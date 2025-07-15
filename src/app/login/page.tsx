'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FaCoins } from 'react-icons/fa';
import Link from 'next/link';

export default function DailyMiningPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [coinsToClaim, setCoinsToClaim] = useState(20);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get user ID from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('smartCoinUser');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      setUserId(userObj.id);

      supabase
        .from('users')
        .select('balance')
        .eq('id', userObj.id)
        .single()
        .then(({ data, error }) => {
          if (data) setUserBalance(data.balance);
        });
    }
  }, []);

  // Check claim eligibility
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    supabase
      .from('users')
      .select('mining_rate, last_mining')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setCoinsToClaim(data.mining_rate || 20);
          const last = data.last_mining ? new Date(data.last_mining).getTime() : null;
          if (last) {
            setLastClaimTime(last);
            const now = Date.now();
            const diff = now - last;
            const limit = 24 * 60 * 60 * 1000;
            if (diff < limit) {
              setCanClaim(false);
              setTimeLeft(limit - diff);
            } else {
              setCanClaim(true);
            }
          } else {
            setCanClaim(true);
          }
        }
        setIsLoading(false);
      });
  }, [userId]);

  // Timer
  useEffect(() => {
    if (!canClaim && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(interval);
            setCanClaim(true);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [canClaim, timeLeft]);

  const handleClaim = useCallback(async () => {
    if (!userId || !canClaim || isLoading) return;

    setIsLoading(true);
    const now = new Date();
    const { error: miningError } = await supabase
      .from('users')
      .update({ last_mining: now.toISOString() })
      .eq('id', userId);

    if (!miningError) {
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id_param: userId,
        amount_param: coinsToClaim
      });

      if (!balanceError) {
        setUserBalance((prev) => (prev !== null ? prev + coinsToClaim : coinsToClaim));
        setCanClaim(false);
        setTimeLeft(24 * 60 * 60 * 1000);
        setLastClaimTime(now.getTime());
      }
    }

    setIsLoading(false);
  }, [userId, canClaim, coinsToClaim, isLoading]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6 text-center text-foreground flex flex-col items-center justify-center">
      <div className="bg-white dark:bg-[#111] rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gold">🎯 التعدين اليومي</h2>
        <p className="mb-4 text-muted-foreground">احصل على عملاتك المجانية كل 24 ساعة!</p>

        {isLoading ? (
          <p className="text-sm text-gray-500">جار التحميل...</p>
        ) : canClaim ? (
          <button
            onClick={handleClaim}
            className="primary-button w-full py-3 text-lg flex justify-center items-center gap-2"
          >
            <FaCoins />
            احصل على {coinsToClaim} عملة
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">لقد قمت بالتعدين اليوم.</p>
            <p className="text-muted-foreground">الوقت المتبقي:</p>
            <p className="text-xl font-semibold text-primary">{formatTime(timeLeft)}</p>
            <button className="secondary-button w-full py-3 text-lg" disabled>
              المطالبة غدًا
            </button>
          </div>
        )}

        {userBalance !== null && (
          <p className="mt-4 text-sm text-muted-foreground">
            رصيدك الحالي: <span className="font-semibold text-gold">{userBalance}</span> عملة
          </p>
        )}

        <Link href="/dashboard" className="block mt-6 text-sm underline text-blue-500">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
