import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-locale";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, User } from "@shared/schema";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Dashboard overview data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<{
    investorsCount: number;
    calculatorsCount: number;
    propertiesCount: number;
    analysesCount: number;
  }>({
    queryKey: ["/api/dashboard/overview"],
  });

  // Recent calculators
  const { data: recentCalculators, isLoading: isCalculatorsLoading } = useQuery<Calculator[]>({
    queryKey: ["/api/calculators/recent"],
  });

  // Mock data for charts
  const calculatorsPerMonthData = [
    { name: "ינואר", count: 4 },
    { name: "פברואר", count: 7 },
    { name: "מרץ", count: 5 },
    { name: "אפריל", count: 9 },
    { name: "מאי", count: 12 },
    { name: "יוני", count: 8 },
  ];

  return (
    <MainLayout>
      <PageHeader title={`שלום, ${user?.name}`} />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              משקיעים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(dashboardData?.investorsCount || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              מחשבונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(dashboardData?.calculatorsCount || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              נכסים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(dashboardData?.propertiesCount || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ניתוחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(dashboardData?.analysesCount || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>מחשבונים לפי חודש</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={calculatorsPerMonthData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Calculators */}
        <Card>
          <CardHeader>
            <CardTitle>מחשבונים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            {isCalculatorsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalculators?.map((calculator) => (
                  <div key={calculator.id} className="border-b pb-3">
                    <div className="font-medium">{calculator.name}</div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>{calculator.investorName}</span>
                      <span>{formatCurrency(calculator.selfEquity, "ILS")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
