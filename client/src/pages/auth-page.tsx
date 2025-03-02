import AuthLayout from "@/components/layouts/auth-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-locale";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import LoginForm from "@/components/forms/login-form";
import RegisterForm from "@/components/forms/register-form";

export default function AuthPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <AuthLayout>
      <div className="flex flex-col md:flex-row w-full">
        {/* Left column - Form */}
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="mb-6 text-center">
                <img 
                  src="/src/assets/telem-logo.svg"
                  alt={t("app.name")} 
                  className="h-12 mx-auto mb-2" 
                />
                <h1 className="text-xl font-bold">{t("app.subtitle")}</h1>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                  <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Hero */}
        <div className="hidden md:flex md:w-1/2 bg-primary text-white p-8 items-center">
          <div className="max-w-lg mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t("auth.welcome")}</h1>
            <p className="text-xl mb-8">{t("auth.intro")}</p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">ניתוח מקיף</h3>
                  <p>חישובי תשואה, תזרים מזומנים, משכנתאות ועוד</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">שיתוף קל</h3>
                  <p>שיתוף פשוט של תוצאות עם משקיעים ושותפים</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">גרפים חכמים</h3>
                  <p>ויזואליזציות מתקדמות להבנה טובה יותר של הנתונים</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
