import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Menu, Bell, Languages } from 'lucide-react';
import TelemLogo from '../TelemLogo';
import { Input } from '@/components/ui/input';

interface TopNavbarProps {
  title?: string;
  subtitle?: string;
  onMenuClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ 
  title, 
  subtitle,
  onMenuClick 
}) => {
  const { user } = useAuth();

  // Get first letter of first name and last name
  const getInitials = (name: string) => {
    if (!name) return '';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name[0] || '';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between p-4">
        {/* הלוגו יופיע עכשיו גם בתצוגת מובייל וגם בדסקטופ */}
        <div className="flex items-center">
          <TelemLogo size="md" className="h-12 ml-2" /> {/* הגדלת הלוגו */}
          {title && (
            <div className="mr-4 text-right hidden md:block">
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button onClick={onMenuClick} className="md:hidden text-gray-700">
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Search bar */}
        <div className="hidden md:block relative w-1/3">
          <Input 
            type="search" 
            placeholder="חיפוש..." 
            className="pr-10 pl-4 bg-gray-50 focus:bg-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Right-side actions */}
        <div className="flex items-center">
          <button className="p-2 ml-2 text-gray-500 hover:text-primary relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="p-2 ml-4 text-gray-500 hover:text-primary">
            <Languages className="h-5 w-5" />
          </button>
          
          {/* Mobile-only user menu */}
          {user && (
            <div className="md:hidden">
              <button className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span>{getInitials(user.name)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
