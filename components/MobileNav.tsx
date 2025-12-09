import React from 'react';
import { NavItem } from '../types';
import { Home, Library, GraduationCap, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: NavItem;
  onNavigate: (tab: NavItem) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onNavigate }) => {
  const navItems = [
    { id: NavItem.Home, label: 'Home', icon: Home },
    { id: NavItem.Library, label: 'Library', icon: Library },
    { id: NavItem.Practice, label: 'Practice', icon: GraduationCap },
    { id: NavItem.Profile, label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};