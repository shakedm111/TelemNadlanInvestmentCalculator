import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-locale";
import LangSwitcher from "@/components/ui/lang-switcher";

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b bg-background px-4 shadow-sm lg:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="px-0 md:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      <div className="md:hidden">
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
      
      <div className="flex flex-1 items-center justify-end space-x-4 space-x-reverse">
        <div className="flex items-center space-x-4 space-x-reverse">
          <LangSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground"
          >
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute top-0 right-0 h-2 w-2 rounded-full p-0"
            />
          </Button>
        </div>
      </div>
    </header>
  );
}
