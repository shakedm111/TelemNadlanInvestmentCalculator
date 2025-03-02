import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import CalculatorCard from '@/components/dashboard/CalculatorCard';
import ComparisonChart from '@/components/dashboard/ComparisonChart';
import InvestmentTable from '@/components/dashboard/InvestmentTable';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import CurrentRates from '@/components/dashboard/CurrentRates';
import { Calculator, Investment, Activity } from '@shared/schema';
import { FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const { user } = useAuth();
  
  // Fetch calculators
  const { data: calculators } = useQuery<Calculator[]>({
    queryKey: ['/api/calculators'],
  });

  // Fetch recent investments
  const { data: recentInvestments = [] } = useQuery<Investment[]>({
    queryKey: ['/api/investments/recent'],
    enabled: !!user,
  });

  // Fetch recent activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // Mock data for comparison chart
  const comparisonData = {
    name: 'השוואת השקעות - פאפוס',
    investments: [
      {
        name: 'Sea View Apartment',
        color: 'hsl(var(--chart-1))',
        values: {
          yield: 7.1,
          mortgagePayment: 680,
          managementFee: 110,
          monthlyCashflow: 310,
          roi: 8.2,
        },
      },
      {
        name: 'City Center Condo',
        color: 'hsl(var(--chart-2))',
        values: {
          yield: 7.9,
          mortgagePayment: 550,
          managementFee: 95,
          monthlyCashflow: 305,
          roi: 8.7,
        },
      },
      {
        name: 'Beachfront Villa',
        color: 'hsl(var(--chart-3))',
        values: {
          yield: 6.8,
          mortgagePayment: 1150,
          managementFee: 180,
          monthlyCashflow: 470,
          roi: 7.5,
        },
      },
    ],
    metrics: [
      { key: 'yield', label: 'תשואה שנתית' },
      { key: 'mortgagePayment', label: 'החזר משכנתא' },
      { key: 'managementFee', label: 'עלויות ניהול' },
      { key: 'monthlyCashflow', label: 'תזרים חודשי' },
      { key: 'roi', label: 'ROI' },
    ],
  };

  // Mock current rates data
  const currentRates = [
    { id: 'exchange', label: 'שער חליפין', value: '€1 = ₪3.98', change: 0.2 },
    { id: 'mortgage_israel', label: 'ריבית משכנתא ישראל', value: '4.7%', change: -0.1 },
    { id: 'mortgage_cyprus', label: 'ריבית משכנתא קפריסין', value: '3.8%', change: 0 },
    { id: 'vat', label: 'מע"מ קפריסין', value: '19%', change: 0 },
    { id: 'realestate_index', label: 'מדד מחירי הנדל"ן', value: '+5.2% (שנתי)', change: 0.3 },
  ];

  // Mock activity feed data
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
  }) || [
    {
      id: 1,
      type: 'calculator_created',
      title: 'נוצר מחשבון חדש',
      description: 'מחשבון "השקעה בלימסול" נוצר עבור ישראל ישראלי',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
    {
      id: 2,
      type: 'analysis_created',
      title: 'ניתוח חדש',
      description: 'ניתוח משכנתא נוצר עבור "Sea View Apartment"',
      timestamp: new Date(Date.now() - 18000000), // 5 hours ago
    },
    {
      id: 3,
      type: 'investment_added',
      title: 'אפשרות השקעה חדשה',
      description: 'נוספה אפשרות השקעה "City Center Condo" למחשבון "השקעה בלימסול"',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: 4,
      type: 'report_created',
      title: 'דוח חדש',
      description: 'דוח השוואת השקעות נוצר ושותף עם ישראל ישראלי',
      timestamp: new Date(Date.now() - 90000000), // ~1 day ago
    },
  ];

  // Recent investments for table
  const investmentTableData = recentInvestments.map(investment => {
    return {
      id: investment.id,
      propertyName: investment.name,
      propertyDetails: '2 חדרי שינה, 85 מ"ר', // This would come from the related property
      location: 'פאפוס', // This would come from the related property
      price: investment.priceOverride || 185000, // This would come from the related property
      monthlyRent: investment.monthlyRentOverride || 1100, // This would come from the related property
      annualYield: 7.1, // This would be calculated
      status: 'available' as const, // This would come from the related property
    };
  });

  // If we don't have real data, use mock data
  if (investmentTableData.length === 0) {
    investmentTableData.push(
      {
        id: 1,
        propertyName: 'Sea View Apartment',
        propertyDetails: '2 חדרי שינה, 85 מ"ר',
        location: 'פאפוס',
        price: 185000,
        monthlyRent: 1100,
        annualYield: 7.1,
        status: 'available' as const,
      },
      {
        id: 2,
        propertyName: 'City Center Condo',
        propertyDetails: '1 חדר שינה, 65 מ"ר',
        location: 'לימסול',
        price: 145000,
        monthlyRent: 950,
        annualYield: 7.9,
        status: 'available' as const,
      },
      {
        id: 3,
        propertyName: 'Beachfront Villa',
        propertyDetails: '3 חדרי שינה, 150 מ"ר',
        location: 'אייה נאפה',
        price: 320000,
        monthlyRent: 1800,
        annualYield: 6.8,
        status: 'in_construction' as const,
      },
      {
        id: 4,
        propertyName: 'Luxury Penthouse',
        propertyDetails: '2 חדרי שינה, 110 מ"ר',
        location: 'לרנקה',
        price: 210000,
        monthlyRent: 1250,
        annualYield: 7.1,
        status: 'sold' as const,
      }
    );
  }

  const handleViewInvestment = (id: number) => {
    // Navigate to investment details
    window.location.href = `/investments/${id}`;
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-dark">לוח בקרה</h1>
            <p className="text-gray-500">ברוך הבא, {user?.name}</p>
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
              <Link href={user?.role === 'advisor' ? '/investors' : '/calculators'}>
                <span>+ {user?.role === 'advisor' ? 'משקיע חדש' : 'מחשבון חדש'}</span>
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            type="investor-info" 
            label="הון עצמי זמין" 
            value="₪1,500,000" 
          />
          
          <StatCard 
            type="calculator-count" 
            label="מספר מחשבונים" 
            value={calculators?.length || 3} 
          />
          
          <StatCard 
            type="properties-count" 
            label="אפשרויות השקעה" 
            value={investmentTableData.length || 7} 
          />
          
          <StatCard 
            type="analyses-count" 
            label="ניתוחים" 
            value={12} 
          />
        </div>
        
        {/* Calculators section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">מחשבונים אחרונים</h2>
            <Link href="/calculators" className="text-primary hover:text-primary-dark text-sm">הצג הכל</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(calculators || []).slice(0, 3).map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                id={calculator.id}
                investorId={calculator.userId}
                name={calculator.name}
                status={calculator.status as any}
                selfEquity={calculator.selfEquity}
                investmentOptions={3} // This would come from a related count
                updatedAt={new Date(calculator.updatedAt)}
              />
            ))}
            
            {(!calculators || calculators.length === 0) && (
              <div className="col-span-full text-center py-12 text-gray-500">
                אין מחשבונים להצגה. 
                <Link href="/calculators/new" className="text-primary hover:underline mr-1">
                  צור מחשבון חדש
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Investment Analysis section */}
        <div className="mb-8">
          <ComparisonChart 
            data={comparisonData} 
            title="השוואת השקעות - פאפוס"
            description="השוואה בין 3 אפשרויות השקעה"
          />
        </div>
        
        {/* Investment Options section */}
        <div className="mb-8">
          <InvestmentTable 
            title="אפשרויות השקעה אחרונות"
            investments={investmentTableData}
            onView={handleViewInvestment}
            showViewAll={true}
            viewAllLink="/investments"
          />
        </div>
        
        {/* Recent Activity & Current Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <ActivityFeed 
              activities={activityFeedData} 
              showMore={true}
              onShowMore={() => window.location.href = '/activities'}
            />
          </div>
          
          {/* Current Rates */}
          <div>
            <CurrentRates 
              rates={currentRates} 
              lastUpdated={new Date()}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HomePage;
