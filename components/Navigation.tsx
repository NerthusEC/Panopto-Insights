import React from 'react';
import { NavItem } from '../types';
import { Home, Library, GraduationCap, User, Moon, Sun } from 'lucide-react';

interface NavigationProps {
  activeTab: NavItem;
  onNavigate: (tab: NavItem) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onNavigate, isDarkMode, toggleTheme }) => {
  const navItems = [
    { id: NavItem.Home, label: 'Home', icon: Home },
    { id: NavItem.Library, label: 'Library', icon: Library },
    { id: NavItem.Practice, label: 'Practice', icon: GraduationCap },
    { id: NavItem.Profile, label: 'Profile', icon: User },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 h-screen border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 shadow-sm z-50 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative w-10 h-10 flex-shrink-0">
            {/* Custom Logo: Turquoise-toned lens inside orbital circular lines */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Orbital Rings */}
                <circle cx="20" cy="20" r="18" stroke={isDarkMode ? "#E5E7EB" : "#1A2E46"} strokeWidth="1" strokeOpacity={isDarkMode ? "0.2" : "0.1"}/>
                <circle cx="20" cy="20" r="14" stroke={isDarkMode ? "#E5E7EB" : "#1A2E46"} strokeWidth="1.5" strokeOpacity={isDarkMode ? "0.3" : "0.2"}/>
                <path d="M20 6C27.732 6 34 12.268 34 20" stroke="#FE6B01" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Lens */}
                <circle cx="20" cy="20" r="9" fill="#2DD4BF" fillOpacity="0.15"/>
                <circle cx="20" cy="20" r="6" fill="url(#lensGradient)"/>
                
                {/* Search Handle */}
                <path d="M25 25L29 29" stroke={isDarkMode ? "#E5E7EB" : "#1A2E46"} strokeWidth="3" strokeLinecap="round"/>
                
                {/* Glint */}
                <circle cx="18" cy="18" r="2" fill="white" fillOpacity="0.5"/>
                
                <defs>
                    <linearGradient id="lensGradient" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2DD4BF"/>
                        <stop offset="1" stopColor="#0D9488"/>
                    </linearGradient>
                </defs>
            </svg>
        </div>
        <div>
            <h1 className="font-bold text-lg tracking-tight text-accent dark:text-white">Panopto</h1>
            <span className="text-xs text-primary font-bold tracking-widest uppercase">Insights</span>
        </div>
      </div>

      <div className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-orange-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-accent dark:hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </button>
      </div>
    </nav>
  );
};