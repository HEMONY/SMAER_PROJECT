import '@/app/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smart Coin',
  description: 'منصة Smart Coin للتعدين والمكافآت',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-background-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
