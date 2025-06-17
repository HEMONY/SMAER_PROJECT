
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component now solely focuses on rendering the Telegram Login Widget.
// The authentication callback is handled by the /api/auth/telegram route.
export default function TelegramLoginComponent() {
  const router = useRouter();

  useEffect(() => {
    // Check for error query parameters from the callback
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      console.error('Telegram login error:', errorParam);
      // Optionally display an error message to the user
      // alert(`Login failed: ${errorParam}`);
      // Clear the error parameter from the URL
      router.replace('/login'); 
    }

    // Inject the Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    // !!! IMPORTANT: Ensure 'Smaercoinbot' is your actual Telegram bot username !!!
    script.setAttribute('data-telegram-login', 'Smaercoinbot'); 
    script.setAttribute('data-size', 'large');
    // This URL points to your backend API route that handles the Telegram callback (using GET)
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram`);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-lang', 'ar');
    script.async = true;

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = ''; // Clear previous widget if any
      container.appendChild(script);
    } else {
      console.error('Telegram login container not found.');
    }

    // Cleanup function to remove the script if the component unmounts
    return () => {
      const widgetScript = document.querySelector('script[src^="https://telegram.org/js/telegram-widget.js"]');
      if (widgetScript) {
        // widgetScript.remove(); // Removing might cause issues if navigation happens quickly
      }
      if (container) {
         // container.innerHTML = ''; // Avoid clearing if navigating away
      }
    };
  }, [router]); // Add router to dependency array

  return (
    // Container where the Telegram Login Widget will be rendered
    <div id="telegram-login-container" className="flex justify-center">
      {/* The Telegram script will inject the button here. */}
      {/* You can add a loading indicator or placeholder if needed */}
      <p className="text-gray-400">جاري تحميل زر تسجيل الدخول...</p>
    </div>
  );
}

