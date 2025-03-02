import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { User } from '@shared/schema';
import AppLayout from '@/components/layout/AppLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { getStatusColorClass, formatDate } from '@/lib/utils';
import { Eye, MoreHorizontal, Plus, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Form schema for creating a new investor
const createInvestorSchema = z.object({
  name: z.string().min(2, { message: 'שם חייב להכיל לפחות 2 תווים' }),
  email: z.string().email({ message: 'כתובת אימייל לא תקינה' }),
  phone: z.string().optional(),
  username: z.string().min(3, { message: 'שם משתמש חייב להכיל לפחות 3 תווים' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים' }),
  role: z.enum(['investor', 'advisor']).default('investor'),
});

type CreateInvestorValues = z.infer<typeof createInvestorSchema>;

const InvestorsPage = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Ensure the user is an advisor
  if (user?.role !== 'advisor') {
    navigate('/');
    return null;
  }

  // Fetch investors (users with role=investor)
  const { data: investors, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', { role: 'investor' }],
  });

  // Create investor mutation
  const createInvestorMutation = useMutation({
    mutationFn: async (data: CreateInvestorValues) => {
      const res = await apiRequest('POST', '/api/register', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsDialogOpen(false);
      toast({
        title: 'משקיע נוצר בהצלחה',
        description: 'המשקיע נוסף למערכת',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת משקיע',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form for creating a new investor
  const form = useForm<CreateInvestorValues>({
    resolver: zodResolver(createInvestorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'investor',
    },
  });

  // Submit form handler
  const onSubmit = (data: CreateInvestorValues) => {
    createInvestorMutation.mutate(data);
  };

  // Table columns definition
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'שם',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'טלפון',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'תאריך הצטרפות',
      cell: ({ row }) => formatDate(new Date(row.original.createdAt!)),
    },
    {
      accessorKey: 'status',
      header: 'סטטוס',
      cell: ({ row }) => {
        const status = row.original.status;
        const { bgColor, textColor } = getStatusColorClass(status);
        return (
          <span className={`${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
            {status === 'active' ? 'פעיל' : 'לא פעיל'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const investor = row.original;
        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link href={`/investors/${investor.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">הצג משקיע</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">פעולות נוספות</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/investors/${investor.id}`}>
                    צפייה בפרטים
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/investors/${investor.id}/calculators`}>
                    מחשבונים
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout title="משקיעים" subtitle="ניהול משקיעים במערכת">
      <div className="p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">דף הבית</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>משקיעים</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">משקיעים</h1>
            <p className="text-muted-foreground">ניהול והוספת משקיעים למערכת</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <UserPlus className="ml-2 h-4 w-4" />
                משקיע חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת משקיע חדש</DialogTitle>
                <DialogDescription>
                  הזן את פרטי המשקיע החדש. המשקיע יקבל גישה למערכת עם הפרטים שתזין.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם מלא</FormLabel>
                        <FormControl>
                          <Input placeholder="ישראל ישראלי" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימייל</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון (אופציונלי)</FormLabel>
                          <FormControl>
                            <Input placeholder="050-0000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם משתמש</FormLabel>
                        <FormControl>
                          <Input placeholder="שם משתמש ייחודי" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סיסמה</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="סיסמה" {...field} />
                        </FormControl>
                        <FormDescription>
                          לפחות 6 תווים
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תפקיד</FormLabel>
                        <FormControl>
                          <RadioGroup
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="investor" id="investor" />
                              <FormLabel htmlFor="investor" className="font-normal cursor-pointer">
                                משקיע
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="advisor" id="advisor" />
                              <FormLabel htmlFor="advisor" className="font-normal cursor-pointer">
                                יועץ
                              </FormLabel>
                            </div>
                          </RadioGroup>
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
                      disabled={createInvestorMutation.isPending}
                    >
                      {createInvestorMutation.isPending ? 'מוסיף...' : 'הוסף משקיע'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Investors table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            data={investors || []}
            searchKey="name"
            searchPlaceholder="חיפוש לפי שם או אימייל..."
          />
        </div>

        {/* Empty state */}
        {!isLoading && (!investors || investors.length === 0) && (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין משקיעים במערכת</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו משקיעים במערכת. הוסף משקיע חדש כדי להתחיל.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              הוסף משקיע ראשון
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default InvestorsPage;
