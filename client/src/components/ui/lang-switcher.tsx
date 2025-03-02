import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/hooks/use-locale";
import { Globe } from "lucide-react";

interface LanguageOption {
  value: "he-IL" | "en-US";
  label: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    value: "he-IL",
    label: "עברית",
    flag: "🇮🇱",
  },
  {
    value: "en-US",
    label: "English",
    flag: "🇺🇸",
  },
];

export default function LangSwitcher() {
  const { locale, setLocale } = useLocale();
  
  const currentLanguage = languages.find(lang => lang.value === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => setLocale(language.value)}
            className="cursor-pointer"
          >
            <span className="ml-2">{language.flag}</span>
            <span>{language.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
