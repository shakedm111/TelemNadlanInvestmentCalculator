import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Property } from '@shared/schema';
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
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import { calculateYield } from '@/lib/financial';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Edit, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const InvestmentDetailsPage = () => {
  const { user } = useAuth();
  const [match, params] = useRoute('/investments/:id');
  const [, navigate] = useLocation();
  const propertyId = match ? parseInt(params.id) : 0;
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    navigate('/');
    return null;
  }

  // Fetch property details
  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let variant:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'success'
      | 'warning'
      | null
      | undefined;
    let label = '';

    switch (status) {
      case 'available':
        variant = 'success';
        label = 'זמין';
        break;
      case 'in_construction':
        variant = 'warning';
        label = 'בבנייה';
        break;
      case 'sold':
        variant = 'destructive';
        label = 'נמכר';
        break;
      default:
        variant = 'secondary';
        label = status;
    }

    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">נכס לא נמצא</h3>
            <p className="text-muted-foreground mb-4">
              הנכס המבוקש לא נמצא במאגר.
            </p>
            <Button asChild>
              <Link href="/investments">חזרה לרשימת הנכסים</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calculate yield
  const annualRent = property.monthlyRent * 12;
  const yield_value = calculateYield(property.priceWithoutVAT, annualRent);

  // Calculate price with VAT (default 19%)
  const vatRate = 0.19;
  const priceWithVAT = property.priceWithoutVAT * (1 + vatRate);

  return (
    <AppLayout title={property.name} subtitle="פרטי נכס">
      <div className="p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">דף הבית</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/investments">נכסים</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{property.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{property.name}</h1>
              <StatusBadge status={property.status} />
            </div>
            <p className="text-muted-foreground">{property.location}</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap space-x-2 space-x-reverse">
            <Button variant="outline" className="flex items-center" size="sm">
              <Share2 className="ml-2 h-4 w-4" />
              <span>שתף</span>
            </Button>
            
            <Button asChild className="flex items-center">
              <Link href={`/investments/${propertyId}/edit`}>
                <Edit className="ml-2 h-4 w-4" />
                <span>ערוך</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Property details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>פרטי נכס</CardTitle>
              <CardDescription>
                {property.description || `${property.bedrooms} חדרי שינה, ${property.bathrooms} חדרי אמבטיה, ${property.area} מ"ר`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">מיקום</h3>
                  <p>{property.location}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">שטח</h3>
                  <p>{property.area} מ"ר</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">סטטוס</h3>
                  <StatusBadge status={property.status} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">חדרי שינה</h3>
                  <p>{property.bedrooms}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">חדרי אמבטיה</h3>
                  <p>{property.bathrooms}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">מועד מסירה</h3>
                  <p>{property.deliveryDate ? formatDate(new Date(property.deliveryDate)) : 'לא הוגדר'}</p>
                </div>
              </div>

              {property.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">תיאור</h3>
                  <p className="whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מידע פיננסי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">מחיר (ללא מע"מ)</h3>
                <p className="text-2xl font-semibold">{formatCurrency(property.priceWithoutVAT, 'EUR')}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">מחיר (כולל מע"מ)</h3>
                <p>{formatCurrency(priceWithVAT, 'EUR')}</p>
                <p className="text-xs text-muted-foreground">מע"מ: {vatRate * 100}%</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">שכירות חודשית</h3>
                <p>{formatCurrency(property.monthlyRent, 'EUR')}</p>
              </div>

              {property.guaranteedRent && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">שכירות מובטחת</h3>
                  <p>{formatCurrency(property.guaranteedRent, 'EUR')}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">שכירות שנתית</h3>
                <p>{formatCurrency(annualRent, 'EUR')}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">תשואה שנתית ברוטו</h3>
                <p className="text-xl font-semibold text-green-600">
                  {formatPercentage(yield_value)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional details section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>מיקום ופרטים נוספים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                <p className="text-muted-foreground">הצג מפה או תמונות</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">עיר</h3>
                  <p>{property.location}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">אזור</h3>
                  <p>מרכז העיר</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">מרחק מהים</h3>
                  <p>500 מטר</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">מרחק ממרכז העיר</h3>
                  <p>1.5 ק"מ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>השקעה במספרים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>תשואה ברוטו</span>
                  <span className="font-semibold">{formatPercentage(yield_value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>תשואה נטו (משוערת)</span>
                  <span className="font-semibold">{formatPercentage(yield_value * 0.85)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>החזר משכנתא משוער (70% מימון)</span>
                  <span className="font-semibold">{formatCurrency(property.priceWithoutVAT * 0.7 * 0.0039, 'EUR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>תזרים חודשי משוער (עם משכנתא)</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(property.monthlyRent - property.priceWithoutVAT * 0.7 * 0.0039 - property.monthlyRent * 0.1, 'EUR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>הון עצמי נדרש (משוער)</span>
                  <span className="font-semibold">{formatCurrency(property.priceWithoutVAT * 0.3 * 1.19, 'EUR')}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full">צור ניתוח מפורט</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvestmentDetailsPage;
