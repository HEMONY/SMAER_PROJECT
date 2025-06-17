"use client";

import { FaWallet, FaStore, FaUsers, FaTasks, FaUser, FaCoins } from 'react-icons/fa'; // Added FaCoins
import Link from 'next/link';

export default function BottomNavigation({ currentPath }: { currentPath: string }) {
  const navItems = [
    { path: '/wallet', label: 'المحفظة', icon: FaWallet },
    { path: '/store', label: 'المتجر', icon: FaStore },
    { path: '/daily-mining', label: 'التعدين اليومي', icon: FaCoins }, // Added Daily Mining link
    { path: '/referrals', label: 'الإحالات', icon: FaUsers },
    { path: '/tasks', label: 'المهام', icon: FaTasks },
    { path: '/profile', label: 'الملف الشخصي', icon: FaUser },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 shadow-top">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`flex flex-col items-center justify-center text-center px-2 py-1 rounded-md transition-colors duration-200 ease-in-out 
                      ${currentPath === item.path 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <item.icon size={24} />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// Basic styling (can be moved to globals.css)
// Added some basic Tailwind classes directly for demonstration
// .bottom-nav {
//   position: fixed;
//   bottom: 0;
//   left: 0;
//   right: 0;
//   display: flex;
//   justify-content: space-around;
//   align-items: center;
//   height: 60px; /* Adjust height as needed */
//   background-color: #ffffff; /* Or your theme's background */
//   border-top: 1px solid #e5e7eb; /* Or your theme's border */
//   z-index: 50;
// }

// .bottom-nav-item {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   text-decoration: none;
//   color: #6b7280; /* Default color */
//   font-size: 0.75rem; /* Adjust font size */
//   padding: 4px 8px;
//   transition: color 0.2s ease-in-out;
// }

// .bottom-nav-item:hover {
//   color: #1f2937; /* Hover color */
// }

// .bottom-nav-item.active {
//   color: #2563eb; /* Active color */
// }

// .bottom-nav-item span {
//   margin-top: 2px;
// }

