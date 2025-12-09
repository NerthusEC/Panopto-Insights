import React from 'react';
import { NavItem } from '../types';
import { Home, Library, GraduationCap, User, LogOut } from 'lucide-react';

interface NavigationProps {
  activeTab: NavItem;
  onNavigate: (tab: NavItem) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onNavigate }) => {
  const navItems = [
    { id: NavItem.Home, label: 'Home', icon: Home },
    { id: NavItem.Library, label: 'Library', icon: Library },
    { id: NavItem.Practice, label: 'Practice', icon: GraduationCap },
    { id: NavItem.Profile, label: 'Profile', icon: User },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 bg-white h-screen border-r border-gray-200 fixed left-0 top-0 shadow-sm z-50">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="relative w-10 h-10 flex-shrink-0">
            {/* Custom Logo: Turquoise-toned lens inside orbital circular lines */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Orbital Rings */}
                <circle cx="20" cy="20" r="18" stroke="#1A2E46" strokeWidth="1" strokeOpacity="0.1"/>
                <circle cx="20" cy="20" r="14" stroke="#1A2E46" strokeWidth="1.5" strokeOpacity="0.2"/>
                <path d="M20 6C27.732 6 34 12.268 34 20" stroke="#FE6B01" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Lens */}
                <circle cx="20" cy="20" r="9" fill="#2DD4BF" fillOpacity="0.15"/>
                <circle cx="20" cy="20" r="6" fill="url(#lensGradient)"/>
                
                {/* Search Handle */}
                <path d="M25 25L29 29" stroke="#1A2E46" strokeWidth="3" strokeLinecap="round"/>
                
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
            <h1 className="font-bold text-lg tracking-tight text-accent">Panopto</h1>
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
                      : 'text-gray-600 hover:bg-gray-50 hover:text-accent'
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

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
};