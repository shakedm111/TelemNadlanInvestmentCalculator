import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Calculator } from '@shared/schema';
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
import CalculatorCard from '@/components/dashboard/CalculatorCard';
import CalculatorForm from '@/components/calculators/CalculatorForm';
import { useToast } from '@/hooks/use-toast';
import { Calculator as CalculatorIcon, FileCog, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvestorCalculatorsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute('/investors/:id/calculators');
  const [, navigate] = useLocation();
  const investorId = match ? parseInt(params.id) : 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    navigate('/');
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

  // Create calculator mutation
  const createCalculatorMutation = useMutation({
    mutationFn: async (data: any) => {
      const calculatorData = {
        ...data,
        userId: investorId,
      };
      const res = await apiRequest('POST', '/api/calculators', calculatorData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators`] });
      setIsDialogOpen(false);
      toast({
        title: 'מחשבון נוצר בהצלחה',
        description: 'המחשבון נוסף למערכת',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת מחשבון',
        description: error.message,
        variant: 'destructive',
      });
    },
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

  const handleSubmit = (data: any) => {
    createCalculatorMutation.mutate(data);
  };

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
    <AppLayout title={`${investor.name} - מחשבונים`} subtitle="ניהול מחשבונים">
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
              <BreadcrumbLink href={`/investors/${investorId}`}>{investor.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>מחשבונים</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{investor.name} - מחשבונים</h1>
            <p className="text-muted-foreground">ניהול מחשבוני השקעות נדל"ן</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <CalculatorIcon className="ml-2 h-4 w-4" />
                מחשבון חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>יצירת מחשבון חדש</DialogTitle>
                <DialogDescription>
                  הגדר מחשבון חדש עבור {investor.name}
                </DialogDescription>
              </DialogHeader>

              <CalculatorForm 
                onSubmit={handleSubmit} 
                isLoading={createCalculatorMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Calculators section */}
        {isLoadingCalculators ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">טוען מחשבונים...</p>
          </div>
        ) : calculators && calculators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {calculators.map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                id={calculator.id}
                investorId={calculator.userId}
                name={calculator.name}
                status={calculator.status as any}
                selfEquity={calculator.selfEquity}
                investmentOptions={3} // This would come from a related count
                updatedAt={new Date(calculator.updatedAt)}
                onEdit={() => navigate(`/investors/${investorId}/calculators/${calculator.id}/edit`)}
                onDelete={() => handleDeleteCalculator(calculator.id)}
                onDuplicate={() => console.log('Duplicate calculator', calculator.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">אין מחשבונים</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <FileCog className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <p className="mb-6 text-muted-foreground">
                אין מחשבונים להצגה עבור המשקיע. צור מחשבון חדש כדי להתחיל.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                צור מחשבון חדש
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default InvestorCalculatorsPage;
