import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CalculatorsPage from "@/pages/calculators-page";
import InvestorsPage from "@/pages/investors-page";
import PropertiesPage from "@/pages/properties-page";
import AnalysesPage from "@/pages/analyses-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { LocaleProvider } from "./hooks/use-locale";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/calculators" component={CalculatorsPage} />
      <ProtectedRoute path="/investors" component={InvestorsPage} />
      <ProtectedRoute path="/properties" component={PropertiesPage} />
      <ProtectedRoute path="/analyses" component={AnalysesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <Router />
          <Toaster />
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
