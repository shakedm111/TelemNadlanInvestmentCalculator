import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Calculator, Investment, Property } from '@shared/schema';
import AppLayout from '@/components/layout/AppLayout';
import { Link, useRoute, useLocation } from 'wouter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Share2, 
  FilePdf, 
  Plus 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import InvestmentForm from '@/components/investments/InvestmentForm';
import AnalysisForm from '@/components/analyses/AnalysisForm';
import InvestmentTable from '@/components/dashboard/InvestmentTable';
import ComparisonChart, { ComparisonData } from '@/components/dashboard/ComparisonChart';
import { 
  calculateYield, 
  calculateMortgagePayment, 
  calculateCashFlow 
} from '@/lib/financial';

const CalculatorDetailsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute('/investors/:id/calculators/:calcId');
  const [, navigate] = useLocation();
  const investorId = match ? parseInt(params.id) : 0;
  const calculatorId = match ? parseInt(params.calcId) : 0;
  const [activeTab, setActiveTab] = useState('overview');
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    navigate('/');
    return null;
  }

  // Fetch investor details
  const { data: investor } = useQuery<User>({
    queryKey: [`/api/admin/users/${investorId}`],
    enabled: !!investorId,
  });

  // Fetch calculator details
  const { data: calculator, isLoading: isLoadingCalculator } = useQuery<Calculator>({
    queryKey: [`/api/calculators/${calculatorId}`],
    enabled: !!calculatorId,
  });

  // Fetch investments for this calculator
  const { data: investments, isLoading: isLoadingInvestments } = useQuery<Investment[]>({
    queryKey: [`/api/calculators/${calculatorId}/investments`],
    enabled: !!calculatorId,
  });

  // Fetch properties for investment form
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Create investment mutation
  const createInvestmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/calculators/${calculatorId}/investments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators/${calculatorId}/investments`] });
      setIsInvestmentDialogOpen(false);
      toast({
        title: 'אפשרות השקעה נוצרה בהצלחה',
        description: 'אפשרות ההשקעה נוספה למחשבון',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת אפשרות השקעה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/calculators/${calculatorId}/analyses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators/${calculatorId}/analyses`] });
      setIsAnalysisDialogOpen(false);
      toast({
        title: 'ניתוח נוצר בהצלחה',
        description: 'הניתוח נוסף למחשבון',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת ניתוח',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete investment mutation
  const deleteInvestmentMutation = useMutation({
    mutationFn: async (investmentId: number) => {
      await apiRequest('DELETE', `/api/investments/${investmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators/${calculatorId}/investments`] });
      toast({
        title: 'אפשרות השקעה נמחקה בהצלחה',
        description: 'אפשרות ההשקעה נמחקה מהמחשבון',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה במחיקת אפשרות השקעה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInvestmentSubmit = (data: any) => {
    createInvestmentMutation.mutate(data);
  };

  const handleAnalysisSubmit = (data: any) => {
    createAnalysisMutation.mutate(data);
  };

  const handleDeleteInvestment = (investmentId: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את אפשרות ההשקעה?')) {
      deleteInvestmentMutation.mutate(investmentId);
    }
  };

  // Prepare investment data for table
  const investmentTableData = (investments || []).map(investment => {
    const property = properties?.find(p => p.id === investment.propertyId);
    if (!property) return null;

    const price = investment.priceOverride || property.priceWithoutVAT;
    const monthlyRent = investment.monthlyRentOverride || property.monthlyRent;
    const annualYield = calculateYield(price, monthlyRent * 12);

    return {
      id: investment.id,
      propertyName: investment.name,
      propertyDetails: `${property.bedrooms} חדרי שינה, ${property.area} מ"ר`,
      location: property.location,
      price: price,
      monthlyRent: monthlyRent,
      annualYield: annualYield,
      status: property.status as any,
    };
  }).filter(Boolean) as any[];

  // Create comparison data if we have investments
  const createComparisonData = (): ComparisonData | null => {
    if (!investments || investments.length < 2 || !properties) return null;

    const colors = [
      'hsl(var(--chart-1))', 
      'hsl(var(--chart-2))', 
      'hsl(var(--chart-3))', 
      'hsl(var(--chart-4))', 
      'hsl(var(--chart-5))'
    ];

    const investmentsData = investments.slice(0, 5).map((investment, index) => {
      const property = properties.find(p => p.id === investment.propertyId);
      if (!property) return null;

      const price = investment.priceOverride || property.priceWithoutVAT;
      const monthlyRent = investment.monthlyRentOverride || property.monthlyRent;
      const annualRent = monthlyRent * 12;
      const yield_value = calculateYield(price, annualRent);
      
      // Calculate mortgage payment (if enabled)
      const mortgagePayment = calculator?.hasMortgage ? 
        calculateMortgagePayment(price * 0.7, 3.8, 25) : 0;
      
      // Calculate management fee if enabled
      const managementFee = investment.hasPropertyManagement ? 
        monthlyRent * 0.1 : 0;
      
      // Calculate cash flow
      const cashflow = calculateCashFlow(
        monthlyRent,
        mortgagePayment,
        managementFee,
        50 // Estimate for other expenses
      );

      return {
        name: investment.name,
        color: colors[index % colors.length],
        values: {
          yield: yield_value,
          mortgagePayment: mortgagePayment,
          managementFee: managementFee,
          monthlyCashflow: cashflow,
          roi: cashflow * 12 / (price * 0.3) * 100, // Approximate ROI based on down payment
          price: price,
        }
      };
    }).filter(Boolean) as any[];

    if (investmentsData.length < 2) return null;

    return {
      name: 'השוואת אפשרויות השקעה',
      investments: investmentsData,
      metrics: [
        { key: 'yield', label: 'תשואה שנתית (%)' },
        { key: 'mortgagePayment', label: 'החזר משכנתא (€)' },
        { key: 'managementFee', label: 'עלויות ניהול (€)' },
        { key: 'monthlyCashflow', label: 'תזרים חודשי (€)' },
        { key: 'roi', label: 'תשואה על ההון (%)' },
        { key: 'price', label: 'מחיר (€)' },
      ]
    };
  };

  const comparisonData = createComparisonData();

  if (isLoadingCalculator) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!calculator) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">מחשבון לא נמצא</h3>
            <p className="text-muted-foreground mb-4">
              המחשבון המבוקש לא נמצא במערכת.
            </p>
            <Button asChild>
              <Link href={`/investors/${investorId}/calculators`}>חזרה למחשבונים</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={calculator.name} subtitle="מחשבון השקעות נדל״ן">
      <div className="p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">דף הבית</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/investors">משקיעים</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/investors/${investorId}`}>
                {investor?.name || 'משקיע'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/investors/${investorId}/calculators`}>
                מחשבונים
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{calculator.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{calculator.name}</h1>
            <p className="text-muted-foreground">
              הון עצמי: {formatCurrency(calculator.selfEquity, 'ILS')} | שער חליפין: {calculator.exchangeRate}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap space-x-2 space-x-reverse">
            <Button variant="outline" className="flex items-center" size="sm">
              <Share2 className="ml-2 h-4 w-4" />
              <span>שתף</span>
            </Button>
            
            <Button variant="outline" className="flex items-center" size="sm">
              <FilePdf className="ml-2 h-4 w-4" />
              <span>PDF</span>
            </Button>
            
            <Button>
              עריכת מחשבון
            </Button>
          </div>
        </div>

        {/* Calculator info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">הון עצמי</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(calculator.selfEquity, 'ILS')}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(calculator.selfEquity / calculator.exchangeRate, 'EUR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">משכנתא</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{calculator.hasMortgage ? 'כן' : 'לא'}</p>
              <p className="text-sm text-muted-foreground">
                {calculator.hasMortgage ? 'כולל מימון משכנתא' : 'ללא מימון משכנתא'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">נכס בישראל</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{calculator.hasPropertyInIsrael ? 'כן' : 'לא'}</p>
              <p className="text-sm text-muted-foreground">
                {calculator.hasPropertyInIsrael ? 'יש נכס בישראל' : 'אין נכס בישראל'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="investments">אפשרויות השקעה</TabsTrigger>
            <TabsTrigger value="analyses">ניתוחים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6">
              {/* Calculator details card */}
              <Card>
                <CardHeader>
                  <CardTitle>פרטי מחשבון</CardTitle>
                  <CardDescription>פרטים כלליים על המחשבון</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold">שם המחשבון</h3>
                      <p>{calculator.name}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">הון עצמי</h3>
                      <p>{formatCurrency(calculator.selfEquity, 'ILS')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">שער חליפין</h3>
                      <p>{calculator.exchangeRate} ₪/€</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">שיעור מע"מ</h3>
                      <p>{calculator.vatRate * 100}%</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">משכנתא</h3>
                      <p>{calculator.hasMortgage ? 'כן' : 'לא'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">נכס בישראל</h3>
                      <p>{calculator.hasPropertyInIsrael ? 'כן' : 'לא'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">סטטוס</h3>
                      <p>{calculator.status === 'active' ? 'פעיל' : calculator.status === 'draft' ? 'טיוטה' : 'בארכיון'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">אפשרויות השקעה</h3>
                      <p>{investments?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison chart if we have multiple investments */}
              {comparisonData && (
                <ComparisonChart 
                  data={comparisonData}
                  title="השוואת אפשרויות השקעה"
                  description="השוואה בין אפשרויות ההשקעה השונות"
                />
              )}

              {/* Investments table */}
              {investmentTableData && investmentTableData.length > 0 && (
                <InvestmentTable 
                  title="אפשרויות השקעה"
                  investments={investmentTableData}
                  onView={(id) => window.location.href = `/investments/${id}`}
                  onEdit={(id) => console.log('Edit investment', id)}
                  onDelete={handleDeleteInvestment}
                />
              )}

              {/* Call to action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>אפשרויות השקעה</CardTitle>
                    <CardDescription>
                      הוספת אפשרויות השקעה חדשות למחשבון
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      הוסף אפשרויות השקעה שונות לבחון במסגרת המחשבון. לכל אפשרות השקעה תוכל להגדיר פרמטרים שונים כמו מחיר, שכירות, ריהוט ועוד.
                    </p>
                    <Button onClick={() => setIsInvestmentDialogOpen(true)}>
                      <Building2 className="ml-2 h-4 w-4" />
                      הוסף אפשרות השקעה
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ניתוחים</CardTitle>
                    <CardDescription>
                      יצירת ניתוחים פיננסיים ליבחון את אפשרויות ההשקעה
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      צור ניתוחים פיננסיים שונים כגון ניתוח משכנתא, תזרים מזומנים, רגישות ועוד. הניתוחים יעזרו לקבל החלטה מושכלת.
                    </p>
                    <Button onClick={() => setIsAnalysisDialogOpen(true)}>
                      <BarChart3 className="ml-2 h-4 w-4" />
                      הוסף ניתוח חדש
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">אפשרויות השקעה</h2>
              <Button onClick={() => setIsInvestmentDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                הוסף אפשרות השקעה
              </Button>
            </div>

            {isLoadingInvestments ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">טוען אפשרויות השקעה...</p>
              </div>
            ) : investmentTableData && investmentTableData.length > 0 ? (
              <InvestmentTable 
                title=""
                investments={investmentTableData}
                onView={(id) => window.location.href = `/investments/${id}`}
                onEdit={(id) => console.log('Edit investment', id)}
                onDelete={handleDeleteInvestment}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">אין אפשרויות השקעה</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Building2 className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                  <p className="mb-6 text-muted-foreground">
                    אין אפשרויות השקעה להצגה עבור המחשבון. הוסף אפשרות השקעה חדשה כדי להתחיל.
                  </p>
                  <Button onClick={() => setIsInvestmentDialogOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף אפשרות השקעה
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analyses">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">ניתוחים</h2>
              <Button onClick={() => setIsAnalysisDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                הוסף ניתוח חדש
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">אין ניתוחים</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <BarChart3 className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                <p className="mb-6 text-muted-foreground">
                  אין ניתוחים להצגה עבור המחשבון. הוסף ניתוח חדש כדי להתחיל.
                </p>
                <Button onClick={() => setIsAnalysisDialogOpen(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  הוסף ניתוח חדש
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Investment Dialog */}
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>הוספת אפשרות השקעה</DialogTitle>
            <DialogDescription>
              הוסף אפשרות השקעה חדשה למחשבון {calculator.name}
            </DialogDescription>
          </DialogHeader>

          {properties ? (
            <InvestmentForm
              calculatorId={calculatorId}
              properties={properties}
              onSubmit={handleInvestmentSubmit}
              isLoading={createInvestmentMutation.isPending}
            />
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500">טוען נכסים...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>יצירת ניתוח חדש</DialogTitle>
            <DialogDescription>
              צור ניתוח חדש עבור מחשבון {calculator.name}
            </DialogDescription>
          </DialogHeader>

          {investments ? (
            <AnalysisForm
              calculatorId={calculatorId}
              investments={investments}
              onSubmit={handleAnalysisSubmit}
              isLoading={createAnalysisMutation.isPending}
            />
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500">טוען נתונים...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CalculatorDetailsPage;
