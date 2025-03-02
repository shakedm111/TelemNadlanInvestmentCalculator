import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import TelemLogo from '../TelemLogo';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  Building2, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: '/', label: 'לוח בקרה', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/investors', label: 'משקיעים', icon: <Users className="w-5 h-5" /> },
    { path: '/calculators', label: 'מחשבונים', icon: <Calculator className="w-5 h-5" /> },
    { path: '/investments', label: 'נכסים', icon: <Building2 className="w-5 h-5" /> },
    { path: '/analyses', label: 'ניתוחים', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/reports', label: 'דוחות', icon: <FileText className="w-5 h-5" /> },
    { path: '/settings', label: 'הגדרות', icon: <Settings className="w-5 h-5" /> },
  ];

  // Get first letter of first name and last name
  const getInitials = (name: string) => {
    if (!name) return '';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name[0] || '';
  };

  const sidebarClasses = open
    ? 'fixed inset-y-0 right-0 z-30 w-64 transform translate-x-0 transition-transform duration-300 ease-in-out'
    : 'fixed inset-y-0 right-0 z-30 w-64 transform translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out';

  return (
    <aside className={`${sidebarClasses} flex flex-col bg-white shadow-lg`}>
      <div className="p-4 border-b flex justify-center items-center">
        <TelemLogo size="md" />
      </div>
      
      {/* User info */}
      {user && (
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
              <span>{getInitials(user.name)}</span>
            </div>
            <div className="mr-3">
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-xs text-gray-500">
                {user.role === 'advisor' ? 'יועץ השקעות' : 'משקיע'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul>
          {navItems.map((item, index) => (
            <li key={index} className="mb-1">
              <Link 
                href={item.path}
                onClick={onClose}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  location === item.path 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="mr-3">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-5 h-5" />
          <span className="mr-3">התנתק</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
