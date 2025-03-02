import { createContext, ReactNode, useContext, useState } from "react";

type Locale = "he-IL" | "en-US";
type Direction = "rtl" | "ltr";

interface LocaleContextType {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
}

const defaultLocale: Locale = "he-IL";
const defaultDirection: Direction = "rtl";

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [direction, setDirection] = useState<Direction>(defaultDirection);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setDirection(newLocale === "he-IL" ? "rtl" : "ltr");
    document.documentElement.setAttribute("dir", newLocale === "he-IL" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", newLocale === "he-IL" ? "he" : "en");
  };

  return (
    <LocaleContext.Provider value={{ locale, direction, setLocale }}>
      <div dir={direction} lang={locale.split("-")[0]}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

// Translations dictionary
const translations = {
  "he-IL": {
    // Common
    "app.name": "תלם נדל\"ן",
    "app.subtitle": "מערכת ניתוח השקעות נדל\"ן בקפריסין",
    
    // Navigation
    "nav.home": "דף הבית",
    "nav.investors": "משקיעים",
    "nav.calculators": "מחשבונים",
    "nav.properties": "ספריית נכסים",
    "nav.analyses": "ניתוחים",
    "nav.settings": "הגדרות",
    
    // Auth
    "auth.login": "התחברות",
    "auth.register": "הרשמה",
    "auth.logout": "התנתק",
    "auth.username": "שם משתמש",
    "auth.password": "סיסמה",
    "auth.email": "דוא\"ל",
    "auth.name": "שם מלא",
    "auth.phone": "טלפון",
    "auth.signin": "התחבר",
    "auth.signup": "הירשם",
    "auth.forgot_password": "שכחתי סיסמה",
    "auth.welcome": "ברוכים הבאים למערכת ניתוח השקעות נדל\"ן של תלם נדל\"ן",
    "auth.intro": "המערכת מאפשרת ניתוח מקיף של השקעות נדל\"ן בקפריסין, כולל חישובי תשואה, תזרים מזומנים ועוד",
    
    // Buttons
    "button.save": "שמירה",
    "button.cancel": "ביטול",
    "button.add": "הוסף",
    "button.edit": "ערוך",
    "button.delete": "מחק",
    "button.share": "שתף",
    "button.print": "הדפס",
    "button.duplicate": "שכפל",
    "button.search": "חיפוש",
    "button.filter": "סינון",
    "button.clear": "נקה",
    "button.reset": "איפוס",
    "button.refresh": "רענן",
    
    // Calculators
    "calculators.title": "מחשבונים",
    "calculators.new": "מחשבון חדש",
    "calculators.name": "שם המחשבון",
    "calculators.investor": "משקיע",
    "calculators.self_equity": "הון עצמי",
    "calculators.has_mortgage": "משכנתא",
    "calculators.has_property_in_israel": "נכס בישראל",
    "calculators.investment_preference": "העדפת מימון",
    "calculators.exchange_rate": "שער חליפין (₪/€)",
    "calculators.vat_rate": "שיעור מע\"מ (%)",
    "calculators.mortgage_rate_israel": "ריבית משכנתא בישראל (%)",
    "calculators.mortgage_rate_cyprus": "ריבית משכנתא בקפריסין (%)",
    "calculators.status": "סטטוס",
    "calculators.investment_options": "אפשרויות השקעה",
    "calculators.analyses": "ניתוחים",
    "calculators.updated_at": "תאריך עדכון",
    "calculators.details": "פרטי מחשבון",
    "calculators.system_params": "פרמטרים מערכתיים",
    
    // Status
    "status.active": "פעיל",
    "status.draft": "טיוטה",
    "status.archived": "בארכיון",
    
    // Investment Preferences
    "preference.positive_cashflow": "תזרים חיובי",
    "preference.low_interest": "ריבית נמוכה",
    "preference.high_yield": "תשואה גבוהה",
    
    // Investors
    "investors.title": "משקיעים",
    "investors.new": "משקיע חדש",
    "investors.name": "שם",
    "investors.email": "דוא\"ל",
    "investors.phone": "טלפון",
    "investors.calculators_count": "מספר מחשבונים",
    "investors.created_at": "תאריך הצטרפות",
    
    // Properties
    "properties.title": "ספריית נכסים",
    "properties.new": "נכס חדש",
    "properties.name": "שם הנכס",
    "properties.price": "מחיר",
    "properties.rent": "שכירות חודשית",
    "properties.location": "מיקום",
    "properties.bedrooms": "חדרי שינה",
    "properties.delivery_date": "מועד מסירה",
    "properties.guaranteed_rent": "שכירות מובטחת",
    
    // Analyses
    "analyses.title": "ניתוחים",
    "analyses.new": "ניתוח חדש",
    "analyses.type": "סוג ניתוח",
    "analyses.calculator": "מחשבון",
    "analyses.investment": "אפשרות השקעה",
    "analyses.parameters": "פרמטרים",
    "analyses.results": "תוצאות",
    
    // Analysis Types
    "analysis.mortgage": "ניתוח משכנתא",
    "analysis.cashflow": "ניתוח תזרים מזומנים",
    "analysis.sensitivity": "ניתוח רגישות",
    "analysis.comparison": "ניתוח השוואתי",
    "analysis.yield": "ניתוח תשואה"
  },
  
  "en-US": {
    // Common
    "app.name": "Telem Real Estate",
    "app.subtitle": "Real Estate Investment Analysis System",
    
    // Navigation
    "nav.home": "Home",
    "nav.investors": "Investors",
    "nav.calculators": "Calculators",
    "nav.properties": "Property Library",
    "nav.analyses": "Analyses",
    "nav.settings": "Settings",
    
    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.logout": "Logout",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.email": "Email",
    "auth.name": "Full Name",
    "auth.phone": "Phone",
    "auth.signin": "Sign In",
    "auth.signup": "Sign Up",
    "auth.forgot_password": "Forgot Password",
    "auth.welcome": "Welcome to Real Estate Investment Analysis System",
    "auth.intro": "The system allows for comprehensive analysis of real estate investments in Cyprus, including yield calculations, cash flow and more",
    
    // Buttons
    "button.save": "Save",
    "button.cancel": "Cancel",
    "button.add": "Add",
    "button.edit": "Edit",
    "button.delete": "Delete",
    "button.share": "Share",
    "button.print": "Print",
    "button.duplicate": "Duplicate",
    "button.search": "Search",
    "button.filter": "Filter",
    "button.clear": "Clear",
    "button.reset": "Reset",
    "button.refresh": "Refresh",
    
    // Calculators
    "calculators.title": "Calculators",
    "calculators.new": "New Calculator",
    "calculators.name": "Calculator Name",
    "calculators.investor": "Investor",
    "calculators.self_equity": "Self Equity",
    "calculators.has_mortgage": "Mortgage",
    "calculators.has_property_in_israel": "Property in Israel",
    "calculators.investment_preference": "Investment Preference",
    "calculators.exchange_rate": "Exchange Rate (₪/€)",
    "calculators.vat_rate": "VAT Rate (%)",
    "calculators.mortgage_rate_israel": "Mortgage Rate Israel (%)",
    "calculators.mortgage_rate_cyprus": "Mortgage Rate Cyprus (%)",
    "calculators.status": "Status",
    "calculators.investment_options": "Investment Options",
    "calculators.analyses": "Analyses",
    "calculators.updated_at": "Updated At",
    "calculators.details": "Calculator Details",
    "calculators.system_params": "System Parameters",
    
    // Status
    "status.active": "Active",
    "status.draft": "Draft",
    "status.archived": "Archived",
    
    // Investment Preferences
    "preference.positive_cashflow": "Positive Cashflow",
    "preference.low_interest": "Low Interest",
    "preference.high_yield": "High Yield",
    
    // Investors
    "investors.title": "Investors",
    "investors.new": "New Investor",
    "investors.name": "Name",
    "investors.email": "Email",
    "investors.phone": "Phone",
    "investors.calculators_count": "Calculators Count",
    "investors.created_at": "Join Date",
    
    // Properties
    "properties.title": "Property Library",
    "properties.new": "New Property",
    "properties.name": "Property Name",
    "properties.price": "Price",
    "properties.rent": "Monthly Rent",
    "properties.location": "Location",
    "properties.bedrooms": "Bedrooms",
    "properties.delivery_date": "Delivery Date",
    "properties.guaranteed_rent": "Guaranteed Rent",
    
    // Analyses
    "analyses.title": "Analyses",
    "analyses.new": "New Analysis",
    "analyses.type": "Analysis Type",
    "analyses.calculator": "Calculator",
    "analyses.investment": "Investment Option",
    "analyses.parameters": "Parameters",
    "analyses.results": "Results",
    
    // Analysis Types
    "analysis.mortgage": "Mortgage Analysis",
    "analysis.cashflow": "Cash Flow Analysis",
    "analysis.sensitivity": "Sensitivity Analysis",
    "analysis.comparison": "Comparison Analysis",
    "analysis.yield": "Yield Analysis"
  }
};

export function useTranslation() {
  const { locale } = useLocale();
  
  const t = (key: string): string => {
    return translations[locale][key as keyof typeof translations[typeof locale]] || key;
  };
  
  return { t };
}
