import React, { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { TelemLogo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Users,
  Calculator,
  Building2,
  BarChart4,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  currentPath: string;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon,
  children,
  currentPath,
}) => {
  const isActive = currentPath === href;

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-gray-600 rounded-md transition-colors",
          isActive
            ? "bg-telem-light text-gray-800 font-medium"
            : "hover:bg-telem-light"
        )}
      >
        <div className="ml-3 text-lg">{icon}</div>
        <span>{children}</span>
      </a>
    </Link>
  );
};

interface DashboardLayoutProps {
  title: string;
  actions?: React.ReactNode;
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  actions,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-telem-light">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex-col w-64 bg-white border-l border-gray-200",
          isMobileMenuOpen
            ? "fixed inset-y-0 right-0 z-50 block"
            : "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-center py-6 border-b border-gray-200">
          <TelemLogo className="h-10" />
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <NavItem href="/" icon={<Home />} currentPath={location}>
              דף הבית
            </NavItem>
            <NavItem
              href="/investors"
              icon={<Users />}
              currentPath={location}
            >
              משקיעים
            </NavItem>
            <NavItem
              href="/calculators"
              icon={<Calculator />}
              currentPath={location}
            >
              מחשבונים
            </NavItem>
            <NavItem
              href="/properties"
              icon={<Building2 />}
              currentPath={location}
            >
              נכסים
            </NavItem>
            <NavItem
              href="/analyses"
              icon={<BarChart4 />}
              currentPath={location}
            >
              ניתוחים
            </NavItem>
            <NavItem
              href="/settings"
              icon={<Settings />}
              currentPath={location}
            >
              הגדרות
            </NavItem>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar className="ml-3">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 truncate">
                {user?.name}
              </h3>
              <p className="text-xs text-gray-500">
                {user?.role === "advisor" ? "יועץ השקעות" : "משקיע"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5 flip-rtl" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileMenu}
                  className="text-gray-500"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>

              {/* Logo for mobile */}
              <div className="flex md:hidden">
                <TelemLogo className="h-8" />
              </div>

              {/* Search bar */}
              <div className="hidden md:flex md:flex-1">
                <div className="w-full max-w-lg lg:max-w-xs ml-4 relative">
                  <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    placeholder="חיפוש..."
                    className="pr-10"
                    type="search"
                  />
                </div>
              </div>

              {/* Right navigation */}
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-4 text-gray-400 hover:text-gray-500"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <div className="mr-4 relative">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-telem-light">
          {/* Page Title */}
          <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {actions && <div className="mt-3 sm:mt-0 sm:mr-4">{actions}</div>}
          </div>

          {/* Content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
