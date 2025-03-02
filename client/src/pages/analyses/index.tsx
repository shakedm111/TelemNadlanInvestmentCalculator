import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Analysis, Calculator } from '@shared/schema';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { BarChart3, FileEdit, Trash2, Eye, Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AnalysisForm from '@/components/analyses/AnalysisForm';

const AnalysesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCalculatorId, setSelectedCalculatorId] = useState<number | null>(null);
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    return null;
  }

  // Fetch all calculators (to select for new analysis)
  const { data: calculators } = useQuery<Calculator[]>({
    queryKey: ['/api/calculators'],
  });

  // Fetch analyses
  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses'],
  });

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedCalculatorId) throw new Error("יש לבחור מחשבון");
      
      const res = await apiRequest('POST', `/api/calculators/${selectedCalculatorId}/analyses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      setIsDialogOpen(false);
      toast({
        title: 'ניתוח נוצר בהצלחה',
        description: 'הניתוח נוסף למערכת',
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

  // Delete analysis mutation
  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      await apiRequest('DELETE', `/api/analyses/${analysisId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      toast({
        title: 'ניתוח נמחק בהצלחה',
        description: 'הניתוח נמחק מהמערכת',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה במחיקת ניתוח',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAnalysisSubmit = (data: any) => {
    createAnalysisMutation.mutate(data);
  };

  const handleDeleteAnalysis = (analysisId: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הניתוח?')) {
      deleteAnalysisMutation.mutate(analysisId);
    }
  };

  // Get analysis type label
  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'mortgage':
        return 'ניתוח משכנתא';
      case 'cashflow':
        return 'תזרים מזומנים';
      case 'sensitivity':
        return 'ניתוח רגישות';
      case 'comparison':
        return 'ניתוח השוואתי';
      case 'yield':
        return 'ניתוח תשואה';
      default:
        return type;
    }
  };

  // Table columns definition
  const columns: ColumnDef<Analysis>[] = [
    {
      accessorKey: 'name',
      header: 'שם הניתוח',
    },
    {
      accessorKey: 'type',
      header: 'סוג ניתוח',
      cell: ({ row }) => getAnalysisTypeLabel(row.original.type),
    },
    {
      accessorKey: 'calculatorId',
      header: 'מחשבון',
      cell: ({ row }) => {
        const calculator = calculators?.find(c => c.id === row.original.calculatorId);
        return calculator?.name || `מחשבון #${row.original.calculatorId}`;
      },
    },
    {
      accessorKey: 'isDefault',
      header: 'ברירת מחדל',
      cell: ({ row }) => row.original.isDefault ? 'כן' : 'לא',
    },
    {
      accessorKey: 'createdAt',
      header: 'תאריך יצירה',
      cell: ({ row }) => formatDate(new Date(row.original.createdAt!)),
    },
    {
      accessorKey: 'status',
      header: 'סטטוס',
      cell: ({ row }) => {
        switch (row.original.status) {
          case 'active':
            return <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">פעיל</span>;
          case 'draft':
            return <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">טיוטה</span>;
          case 'archived':
            return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">בארכיון</span>;
          default:
            return row.original.status;
        }
      },
    },
    {
      id: 'actions',
      header: 'פעולות',
      cell: ({ row }) => {
        const analysis = row.original;
        return (
          <div className="flex items-center justify-end space-x-2 space-x-reverse">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/analyses/${analysis.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">צפייה</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/analyses/${analysis.id}/edit`}>
                <FileEdit className="h-4 w-4" />
                <span className="sr-only">עריכה</span>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteAnalysis(analysis.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">מחיקה</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout title="ניתוחים" subtitle="ניתוחים פיננסיים">
      <div className="p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">דף הבית</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ניתוחים</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">ניתוחים פיננסיים</h1>
            <p className="text-muted-foreground">ניהול ויצירת ניתוחים פיננסיים להשקעות נדל"ן</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <BarChart3 className="ml-2 h-4 w-4" />
                ניתוח חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>יצירת ניתוח חדש</DialogTitle>
              </DialogHeader>

              {calculators && calculators.length > 0 ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">בחר מחשבון</label>
                    <Select
                      value={selectedCalculatorId?.toString() || ''}
                      onValueChange={(value) => setSelectedCalculatorId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מחשבון" />
                      </SelectTrigger>
                      <SelectContent>
                        {calculators.map((calculator) => (
                          <SelectItem key={calculator.id} value={calculator.id.toString()}>
                            {calculator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCalculatorId && (
                    <AnalysisForm
                      calculatorId={selectedCalculatorId}
                      investments={[]} // This would need to be fetched for the selected calculator
                      onSubmit={handleAnalysisSubmit}
                      isLoading={createAnalysisMutation.isPending}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="mb-4 text-muted-foreground">
                    אין מחשבונים זמינים ליצירת ניתוח. צור מחשבון תחילה.
                  </p>
                  <Button asChild>
                    <Link href="/calculators/new">צור מחשבון</Link>
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Analyses table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            data={analyses || []}
            searchKey="name"
            searchPlaceholder="חיפוש לפי שם..."
          />
        </div>

        {/* Empty state */}
        {!isLoading && (!analyses || analyses.length === 0) && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין ניתוחים</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו ניתוחים במערכת. צור ניתוח חדש כדי להתחיל.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              צור ניתוח חדש
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AnalysesPage;
