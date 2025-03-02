import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = 'תלם נדל"ן', 
  subtitle = 'מערכת ניתוח השקעות נדל"ן' 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar 
          title={title} 
          subtitle={subtitle}
          onMenuClick={toggleSidebar} 
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background-light">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
