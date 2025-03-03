import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/use-locale";
import {
  Home,
  Users,
  Calculator,
  Building2,
  BarChart4,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      title: t("nav.home"),
      href: "/",
      icon: Home,
    },
    {
      title: t("nav.investors"),
      href: "/investors",
      icon: Users,
    },
    {
      title: t("nav.calculators"),
      href: "/calculators",
      icon: Calculator,
    },
    {
      title: t("nav.properties"),
      href: "/properties",
      icon: Building2,
    },
    {
      title: t("nav.analyses"),
      href: "/analyses",
      icon: BarChart4,
    },
    {
      title: t("nav.settings"),
      href: "/settings",
      icon: Settings,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10 bg-sidebar shadow-md">
      <div className="flex flex-col flex-1">
        <div className="flex h-16 shrink-0 items-center justify-center px-6 border-b border-sidebar-border">
          <Link href="/">
            <img 
              src="/images/telem-logo.png" 
              alt={t("app.name")} 
              className="h-8" 
              width="auto"
              height="32"
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-md cursor-pointer",
                    isActive
                      ? "text-sidebar-primary bg-sidebar-accent border-r-4 border-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-colors duration-200"
                  )}
                >
                  <item.icon className="h-5 w-5 ms-3" />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 mt-auto">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <AvatarFallback>{user ? getInitials(user.name) : ""}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "advisor" ? "יועץ השקעות" : "משקיע"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
