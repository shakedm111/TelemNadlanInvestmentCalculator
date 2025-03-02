import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Property } from '@shared/schema';
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
import { calculateYield } from '@/lib/financial';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Building2, Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Property form schema
const propertyFormSchema = z.object({
  name: z.string().min(2, { message: 'שם חייב להכיל לפחות 2 תווים' }),
  location: z.string().min(2, { message: 'יש להזין מיקום' }),
  priceWithoutVAT: z.coerce.number().min(1, { message: 'יש להזין מחיר חיובי' }),
  monthlyRent: z.coerce.number().min(1, { message: 'יש להזין שכירות חיובית' }),
  guaranteedRent: z.coerce.number().optional(),
  area: z.coerce.number().min(1, { message: 'יש להזין שטח חיובי' }),
  bedrooms: z.coerce.number().min(1, { message: 'יש להזין מספר חדרי שינה' }),
  bathrooms: z.coerce.number().min(1, { message: 'יש להזין מספר חדרי אמבטיה' }),
  description: z.string().optional(),
  deliveryDate: z.string().optional(),
  status: z.enum(['available', 'in_construction', 'sold']).default('available'),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

const InvestmentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    return null;
  }

  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const res = await apiRequest('POST', '/api/properties', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setIsDialogOpen(false);
      toast({
        title: 'נכס נוצר בהצלחה',
        description: 'הנכס נוסף למאגר',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת נכס',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await apiRequest('DELETE', `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: 'נכס נמחק בהצלחה',
        description: 'הנכס נמחק מהמאגר',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה במחיקת נכס',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form for creating a new property
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: '',
      location: '',
      priceWithoutVAT: 0,
      monthlyRent: 0,
      guaranteedRent: undefined,
      area: 0,
      bedrooms: 1,
      bathrooms: 1,
      description: '',
      deliveryDate: '',
      status: 'available',
    },
  });

  // Submit form handler
  const onSubmit = (data: PropertyFormValues) => {
    createPropertyMutation.mutate(data);
  };

  const handleDeleteProperty = (propertyId: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הנכס?')) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

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

  // Table columns definition
  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: 'name',
      header: 'שם הנכס',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.bedrooms} חדרי שינה, {row.original.area} מ"ר
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'מיקום',
    },
    {
      accessorKey: 'priceWithoutVAT',
      header: 'מחיר (€)',
      cell: ({ row }) => formatCurrency(row.original.priceWithoutVAT, 'EUR'),
    },
    {
      accessorKey: 'monthlyRent',
      header: 'שכירות חודשית (€)',
      cell: ({ row }) => formatCurrency(row.original.monthlyRent, 'EUR'),
    },
    {
      accessorKey: 'yield',
      header: 'תשואה שנתית',
      cell: ({ row }) => {
        const annualRent = row.original.monthlyRent * 12;
        const yield_value = calculateYield(row.original.priceWithoutVAT, annualRent);
        return <span className="text-green-600 font-medium">{formatPercentage(yield_value)}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'סטטוס',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  פעולות
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/investments/${property.id}`}>
                    צפייה בפרטים
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/investments/${property.id}/edit`}>
                    עריכה
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteProperty(property.id)}>
                  מחיקה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout title="נכסים" subtitle="ניהול מאגר הנכסים">
      <div className="p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">דף הבית</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>נכסים</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">נכסים</h1>
            <p className="text-muted-foreground">ניהול והוספת נכסים למאגר</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Building2 className="ml-2 h-4 w-4" />
                נכס חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>הוספת נכס חדש</DialogTitle>
                <DialogDescription>
                  הוסף נכס חדש למאגר הנכסים
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם הנכס</FormLabel>
                          <FormControl>
                            <Input placeholder="דירת חוף בפאפוס" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מיקום</FormLabel>
                          <FormControl>
                            <Input placeholder="פאפוס" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="priceWithoutVAT"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מחיר ללא מע"מ (€)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שכירות חודשית (€)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שטח (מ"ר)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>חדרי שינה</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>חדרי אמבטיה</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="guaranteedRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שכירות מובטחת (€, אופציונלי)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="הכנס אם יש שכירות מובטחת"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תאריך מסירה (אופציונלי)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סטטוס</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר סטטוס" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">זמין</SelectItem>
                              <SelectItem value="in_construction">בבנייה</SelectItem>
                              <SelectItem value="sold">נמכר</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תיאור (אופציונלי)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="תיאור מפורט של הנכס" 
                            className="h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPropertyMutation.isPending}
                    >
                      {createPropertyMutation.isPending ? 'מוסיף...' : 'הוסף נכס'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Properties table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            data={properties || []}
            searchKey="name"
            searchPlaceholder="חיפוש לפי שם או מיקום..."
          />
        </div>

        {/* Empty state */}
        {!isLoading && (!properties || properties.length === 0) && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין נכסים במאגר</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו נכסים במאגר. הוסף נכס חדש כדי להתחיל.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              הוסף נכס ראשון
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default InvestmentsPage;
