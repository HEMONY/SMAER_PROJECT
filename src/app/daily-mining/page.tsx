
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client'; // Import Supabase client
// import { useAuth } from '@/hooks/useAuth'; // Hypothetical auth hook to get user ID

const DailyMiningPage = () => {
  const [canClaim, setCanClaim] = useState(false); // Default to false until user data is loaded
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [coinsToClaim, setCoinsToClaim] = useState(20); // Default value
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); // Placeholder for user ID
  const [userBalance, setUserBalance] = useState<number | null>(null); // Placeholder for user balance

  // --- Placeholder for fetching user ID and initial balance --- 
  // In a real app, this would likely come from an auth context or session
  useEffect(() => {
    // Simulate fetching user ID
    const fetchUser = async () => {
        // Replace with actual user fetching logic, e.g., from session
        const mockUserId = 'f8a4e3a2-5b7c-4f0e-8d3a-1b9c6a7e8f0d'; // Example UUID
        setUserId(mockUserId);

        if (mockUserId) {
            // Fetch initial balance if needed elsewhere, or rely on mining_rate
            const { data: balanceData, error: balanceError } = await supabase
                .from('users')
                .select('balance')
                .eq('id', mockUserId)
                .single();
            if (balanceData) {
                setUserBalance(balanceData.balance);
            }
        }
    };
    fetchUser();
  }, []);
  // --- End Placeholder ---

  // Function to check eligibility and update state on load based on DB
  useEffect(() => {
    if (!userId) return; // Don't run if userId is not set yet

    setIsLoading(true);
    const checkClaimStatus = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('mining_rate, last_mining') // Fetch mining_rate and last_mining
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        if (userData) {
          setCoinsToClaim(userData.mining_rate || 20); // Use DB mining_rate, default to 20

          const lastClaim = userData.last_mining ? new Date(userData.last_mining).getTime() : null;
          if (lastClaim) {
            setLastClaimTime(lastClaim);
            const now = Date.now();
            const timePassed = now - lastClaim;
            const twentyFourHours = 24 * 60 * 60 * 1000;

            if (timePassed < twentyFourHours) {
              setCanClaim(false);
              setTimeLeft(twentyFourHours - timePassed);
            } else {
              setCanClaim(true);
              setTimeLeft(0);
            }
          } else {
            // No previous claim found in DB
            setCanClaim(true);
            setTimeLeft(0);
          }
        } else {
           // User data not found, handle appropriately (e.g., show error, keep defaults)
           console.warn('User data not found for ID:', userId);
           setCanClaim(true); // Allow first claim maybe?
           setTimeLeft(0);
        }
      } catch (error) {
        console.error('Error fetching user claim status:', error);
        // Handle error (e.g., show toast message)
        // Maybe default to allowing claim or showing an error state
        setCanClaim(false); // Safer to disable claim on error
      } finally {
        setIsLoading(false);
      }
    };

    checkClaimStatus();
  }, [userId]); // Rerun when userId is available

  // Countdown timer effect
  useEffect(() => {
    if (!canClaim && timeLeft > 0) {
      const intervalId = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft <= 1000) {
            clearInterval(intervalId);
            setCanClaim(true);
            setLastClaimTime(null); // Reset last claim time visually
            return 0;
          }
          return prevTimeLeft - 1000;
        });
      }, 1000);

      return () => clearInterval(intervalId); // Cleanup interval
    }
  }, [canClaim, timeLeft]);

  // Handle claim button click
  const handleClaim = useCallback(async () => {
    if (!canClaim || !userId || isLoading) return;

    setIsLoading(true); // Disable button while processing
    try {
      const now = new Date();

      // Option 1: Call an RPC function (if one exists for safe client-side claiming)
      /*
      const { error: rpcError } = await supabase.rpc('claim_daily_reward', { user_id_param: userId });
      if (rpcError) throw rpcError;
      */

      // Option 2: Update last_mining time. Assumes a DB trigger/function handles balance update.
      // This is simpler client-side but relies on DB logic.
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_mining: now.toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      // --- Important: Add coins to balance --- 
      // The provided `api.js` `performMining` function updates balance based on `mining_rate`.
      // We need similar logic here, either via RPC or direct update if RLS allows.
      // Let's assume we need to call an RPC function `increment_balance` like in api.js
      // Note: Direct balance update from client is generally unsafe without proper RLS.
      const { error: balanceUpdateError } = await supabase.rpc('increment_balance', { user_id_param: userId, amount_param: coinsToClaim });
      if (balanceUpdateError) {
          // Rollback or handle error: Maybe the last_mining update should be conditional?
          console.error('Failed to update balance:', balanceUpdateError);
          // Attempt to revert last_mining? Or just notify user.
          // For now, log error and proceed with UI update, but this needs robust handling.
      } else {
          // Update local balance state if needed
          setUserBalance((prev) => (prev !== null ? prev + coinsToClaim : null));
          console.log(`Successfully claimed ${coinsToClaim} coins! Balance updated.`);
      }
      // --- End Balance Update ---

      // Update UI state after successful DB operations
      setLastClaimTime(now.getTime());
      setCanClaim(false);
      setTimeLeft(24 * 60 * 60 * 1000);

    } catch (error) {
      console.error('Error claiming coins:', error);
      // TODO: Show error toast to user
    } finally {
      setIsLoading(false);
    }
  }, [canClaim, userId, isLoading, coinsToClaim]);

  // Format timeLeft into HH:MM:SS
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">التعدين اليومي</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-gray-600 dark:text-gray-400">احصل على عملاتك المجانية كل يوم!</p>
          {isLoading ? (
            <p>جار التحميل...</p>
          ) : canClaim ? (
            <Button onClick={handleClaim} size="lg" disabled={isLoading}>
              {/* Modified Button Text */}
              {isLoading ? 'جار المعالجة...' : <><span role="img" aria-label="coin" className="mr-2">🪙</span>{`احصل على ${coinsToClaim} عملة يومياً`}</>}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">لقد حصلت على عملاتك لهذا اليوم.</p>
              <p className="text-gray-600 dark:text-gray-400">يمكنك الحصول عليها مجدداً بعد:</p>
              <div className="text-3xl font-bold my-3 text-blue-600 dark:text-blue-400">{formatTimeLeft(timeLeft)}</div>
              <Button disabled size="lg">
                المطالبة غداً
              </Button>
            </div>
          )}
          {/* Optional: Display current balance */} 
          {/* userBalance !== null && <p className="mt-4 text-sm text-gray-500">رصيدك الحالي: {userBalance} عملة</p> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyMiningPage;

