import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Calculator, Activity } from '@shared/schema';
import AppLayout from '@/components/layout/AppLayout';
import { Link, useRoute } from 'wouter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/dashboard/StatCard';
import CalculatorCard from '@/components/dashboard/CalculatorCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { useToast } from '@/hooks/use-toast';
import { FileText, Share2, Calculator as CalculatorIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, getRelativeTime } from '@/lib/utils';

const InvestorDetailsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute('/investors/:id');
  const investorId = match ? parseInt(params.id) : 0;
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    return null;
  }

  // Fetch investor details
  const { data: investor, isLoading: isLoadingInvestor } = useQuery<User>({
    queryKey: [`/api/admin/users/${investorId}`],
    enabled: !!investorId,
  });

  // Fetch investor's calculators
  const { data: calculators, isLoading: isLoadingCalculators } = useQuery<Calculator[]>({
    queryKey: [`/api/calculators?userId=${investorId}`],
    enabled: !!investorId,
  });

  // Fetch recent activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: [`/api/activities?userId=${investorId}&limit=5`],
    enabled: !!investorId,
  });

  // Delete calculator mutation
  const deleteCalculatorMutation = useMutation({
    mutationFn: async (calculatorId: number) => {
      await apiRequest('DELETE', `/api/calculators/${calculatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators`] });
      toast({
        title: 'מחשבון נמחק בהצלחה',
        description: 'המחשבון נמחק מהמערכת',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה במחיקת מחשבון',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Activity feed data transformation
  const activityFeedData = activities?.map(activity => {
    let type: 'calculator_created' | 'analysis_created' | 'investment_added' | 'report_created' = 'calculator_created';
    let title = '';
    let description = '';
    
    const details = activity.details as any || {};
    
    switch (activity.activityType) {
      case 'calculator_created':
        type = 'calculator_created';
        title = 'נוצר מחשבון חדש';
        description = `מחשבון "${details.calculatorName || 'חדש'}" נוצר`;
        break;
      case 'analysis_created':
        type = 'analysis_created';
        title = 'ניתוח חדש';
        description = `ניתוח ${details.analysisType || ''} נוצר עבור "${details.analysisName || 'השקעה'}"`;
        break;
      case 'investment_created':
        type = 'investment_added';
        title = 'אפשרות השקעה חדשה';
        description = `נוספה אפשרות השקעה "${details.investmentName || 'חדשה'}"`;
        break;
      default:
        type = 'report_created';
        title = 'דוח חדש';
        description = 'דוח השוואת השקעות נוצר';
    }
    
    return {
      id: activity.id,
      type,
      title,
      description,
      timestamp: new Date(activity.createdAt || Date.now()),
    };
  }) || [];

  const handleDeleteCalculator = (calculatorId: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המחשבון?')) {
      deleteCalculatorMutation.mutate(calculatorId);
    }
  };

  if (isLoadingInvestor) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!investor) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">משקיע לא נמצא</h3>
            <p className="text-muted-foreground mb-4">
              המשקיע המבוקש לא נמצא במערכת.
            </p>
            <Button asChild>
              <Link href="/investors">חזרה לרשימת המשקיעים</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={investor.name} subtitle="פרטי משקיע">
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
              <BreadcrumbPage>{investor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{investor.name}</h1>
            <p className="text-muted-foreground">{investor.email} | {investor.phone || 'אין מספר טלפון'}</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap space-x-2 space-x-reverse">
            <Button variant="outline" className="flex items-center" size="sm">
              <Share2 className="ml-2 h-4 w-4" />
              <span>שתף</span>
            </Button>
            
            <Button variant="outline" className="flex items-center" size="sm">
              <FileText className="ml-2 h-4 w-4" />
              <span>PDF</span>
            </Button>
            
            <Button asChild>
              <Link href={`/investors/${investorId}/calculators/new`}>
                <CalculatorIcon className="ml-2 h-4 w-4" />
                מחשבון חדש
              </Link>
            </Button>
          </div>
        </div>

        {/* Investor info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            type="investor-info" 
            label="הון עצמי זמין" 
            value={(calculators && calculators.length > 0) ? 
              `₪${calculators[0].selfEquity.toLocaleString()}` : 
              'לא זמין'} 
          />
          
          <StatCard 
            type="calculator-count" 
            label="מספר מחשבונים" 
            value={calculators?.length || 0} 
          />
          
          <StatCard 
            type="properties-count" 
            label="אפשרויות השקעה" 
            value={0} // This would need to be calculated from related investments
          />
          
          <StatCard 
            type="analyses-count" 
            label="ניתוחים" 
            value={0} // This would need to be calculated from related analyses
          />
        </div>

        {/* Investor details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>פרטי משקיע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">שם מלא</h3>
                  <p>{investor.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">אימייל</h3>
                  <p>{investor.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold">טלפון</h3>
                  <p>{investor.phone || 'לא הוגדר'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">שם משתמש</h3>
                  <p>{investor.username}</p>
                </div>
                <div>
                  <h3 className="font-semibold">סטטוס</h3>
                  <p>{investor.status === 'active' ? 'פעיל' : 'לא פעיל'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">תאריך הצטרפות</h3>
                  <p>{formatDate(new Date(investor.createdAt!))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <Button asChild className="w-full">
                <Link href={`/investors/${investorId}/calculators`}>
                  <CalculatorIcon className="ml-2 h-4 w-4" />
                  צפייה במחשבונים
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/investors/${investorId}/calculators/new`}>
                  יצירת מחשבון חדש
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                שליחת אימייל למשקיע
              </Button>
              <Button variant="outline" className="w-full">
                שלח קישור להתחברות
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Calculators section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">מחשבונים</h2>
            <Link href={`/investors/${investorId}/calculators`} className="text-primary hover:text-primary-dark text-sm">
              הצג הכל
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoadingCalculators ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">טוען מחשבונים...</p>
              </div>
            ) : calculators && calculators.length > 0 ? (
              calculators.slice(0, 3).map((calculator) => (
                <CalculatorCard
                  key={calculator.id}
                  id={calculator.id}
                  investorId={calculator.userId}
                  name={calculator.name}
                  status={calculator.status as any}
                  selfEquity={calculator.selfEquity}
                  investmentOptions={3} // This would come from a related count
                  updatedAt={new Date(calculator.updatedAt)}
                  onEdit={() => window.location.href = `/investors/${investorId}/calculators/${calculator.id}/edit`}
                  onDelete={() => handleDeleteCalculator(calculator.id)}
                  onDuplicate={() => console.log('Duplicate calculator', calculator.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                אין מחשבונים להצגה. 
                <Link href={`/investors/${investorId}/calculators/new`} className="text-primary hover:underline mr-1">
                  צור מחשבון חדש
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="mb-8">
          <ActivityFeed 
            activities={activityFeedData} 
            title="פעילות אחרונה" 
            showMore={true}
            onShowMore={() => window.location.href = `/investors/${investorId}/activities`}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default InvestorDetailsPage;
