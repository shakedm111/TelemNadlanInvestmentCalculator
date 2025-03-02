import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TelemButton } from "@/components/ui/telem-button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Calculator, insertCalculatorSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, PlusCircle, Eye, Pencil, Trash2, Mail, Phone, CalendarDays, BarChart4, Building2 } from "lucide-react";

// New calculator form schema
const calculatorFormSchema = insertCalculatorSchema.extend({
  name: z.string().min(1, "שם המחשבון נדרש"),
  selfEquity: z.coerce.number().min(1, "הון עצמי נדרש"),
  hasMortgage: z.boolean().default(false),
  hasPropertyInIsrael: z.boolean().default(false),
  exchangeRate: z.coerce.number().min(0.1, "שער חליפין לא תקין"),
  vatRate: z.coerce.number().min(0, "שיעור מע\"מ לא תקין").max(100, "שיעור מע\"מ לא תקין"),
});

type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Format date to Israeli format (DD.MM.YYYY)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
};

export default function InvestorDetails() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const investorId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddCalculatorOpen, setIsAddCalculatorOpen] = useState(false);

  // Load investor data
  const { data: investor, isLoading: isLoadingInvestor } = useQuery<User>({
    queryKey: [`/api/investors/${investorId}`],
    queryFn: async () => {
      // In a real app, this would be an API call
      // return (await apiRequest("GET", `/api/investors/${investorId}`)).json();
      
      // Mock data for demonstration
      return Promise.resolve({
        id: investorId,
        username: "dani.cohen",
        password: "",
        name: "דני כהן",
        email: "dani.cohen@example.com",
        phone: "052-1234567",
        role: "investor",
        status: "active",
        createdAt: "2023-04-15T10:30:00Z",
        updatedAt: "2023-08-10T14:20:00Z",
      });
    },
  });

  // Load calculators for this investor
  const { data: calculators, isLoading: isLoadingCalculators } = useQuery<Calculator[]>({
    queryKey: [`/api/calculators?userId=${investorId}`],
    queryFn: async () => {
      // In a real app, this would be an API call
      // return (await apiRequest("GET", `/api/calculators?userId=${investorId}`)).json();
      
      // Mock data for demonstration
      return Promise.resolve([
        {
          id: 1,
          userId: investorId,
          name: "חישוב השקעה בלרנקה",
          selfEquity: 500000,
          hasMortgage: true,
          hasPropertyInIsrael: true,
          exchangeRate: 3.6,
          vatRate: 19,
          status: "active",
          createdAt: "2023-04-16T10:30:00Z",
          updatedAt: "2023-04-16T10:30:00Z",
        },
        {
          id: 2,
          userId: investorId,
          name: "חישוב השקעה בפאפוס",
          selfEquity: 800000,
          hasMortgage: true,
          hasPropertyInIsrael: false,
          exchangeRate: 3.6,
          vatRate: 19,
          status: "active",
          createdAt: "2023-05-20T15:45:00Z",
          updatedAt: "2023-05-20T15:45:00Z",
        },
        {
          id: 3,
          userId: investorId,
          name: "חישוב השקעה בלימסול",
          selfEquity: 1200000,
          hasMortgage: false,
          hasPropertyInIsrael: true,
          exchangeRate: 3.6,
          vatRate: 19,
          status: "draft",
          createdAt: "2023-07-05T09:15:00Z",
          updatedAt: "2023-07-05T09:15:00Z",
        },
      ]);
    },
  });

  // Create calculator form
  const calculatorForm = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      userId: investorId,
      name: "",
      selfEquity: 500000,
      hasMortgage: false,
      hasPropertyInIsrael: false,
      exchangeRate: 3.6,
      vatRate: 19,
      status: "active",
    },
  });

  // Create calculator mutation
  const createCalculatorMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      // In a real app, this would be an API call
      // const response = await apiRequest("POST", "/api/calculators", data);
      // return response.json();
      
      // Mock response for demonstration
      return Promise.resolve({
        ...data,
        id: Math.floor(Math.random() * 1000) + 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calculators?userId=${investorId}`] });
      toast({
        title: "מחשבון נוצר בהצלחה",
        description: "המחשבון נוסף למערכת",
      });
      setIsAddCalculatorOpen(false);
      calculatorForm.reset({
        userId: investorId,
        name: "",
        selfEquity: 500000,
        hasMortgage: false,
        hasPropertyInIsrael: false,
        exchangeRate: 3.6,
        vatRate: 19,
        status: "active",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה ביצירת מחשבון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmitCalculator = (data: CalculatorFormData) => {
    createCalculatorMutation.mutate(data);
  };

  // Define table columns for calculators
  const calculatorColumns: Column<Calculator>[] = [
    {
      key: "name",
      header: "שם המחשבון",
      cell: (calculator) => (
        <div className="text-sm font-medium text-gray-900">{calculator.name}</div>
      ),
      sortable: true,
    },
    {
      key: "selfEquity",
      header: "הון עצמי",
      cell: (calculator) => (
        <div className="text-sm text-gray-900">
          {new Intl.NumberFormat("he-IL", {
            style: "currency",
            currency: "ILS",
            maximumFractionDigits: 0,
          }).format(calculator.selfEquity)}
        </div>
      ),
      sortable: true,
    },
    {
      key: "hasMortgage",
      header: "משכנתא",
      cell: (calculator) => (
        <div className="text-sm text-gray-900">
          {calculator.hasMortgage ? "כן" : "לא"}
        </div>
      ),
    },
    {
      key: "status",
      header: "סטטוס",
      cell: (calculator) => <StatusBadge status={calculator.status} />,
      sortable: true,
    },
    {
      key: "createdAt",
      header: "תאריך יצירה",
      cell: (calculator) => (
        <div className="text-sm text-gray-500">
          {formatDate(calculator.createdAt)}
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "פעולות",
      cell: (calculator) => (
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/calculators/${calculator.id}`);
            }}
            className="text-telem-primary hover:text-telem-primary-dark"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // Edit calculator logic
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // Delete calculator logic
            }}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoadingInvestor) {
    return (
      <DashboardLayout title="טוען פרטי משקיע...">
        <div className="flex items-center justify-center h-64">
          <LoaderCircle className="w-12 h-12 animate-spin text-telem-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!investor) {
    return (
      <DashboardLayout title="משקיע לא נמצא">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">המשקיע לא נמצא</h2>
          <p className="text-gray-600 mb-6">ייתכן שהמשקיע הוסר או שאין לך הרשאות לצפות בו</p>
          <Button
            onClick={() => navigate("/investors")}
            className="bg-telem-primary hover:bg-telem-primary-dark"
          >
            חזור לרשימת המשקיעים
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`פרטי משקיע: ${investor.name}`}
      actions={
        <>
          <Button variant="outline" className="ml-2" onClick={() => navigate("/investors")}>
            חזרה לרשימה
          </Button>
          <TelemButton
            onClick={() => setIsAddCalculatorOpen(true)}
            iconRight={<PlusCircle className="h-4 w-4" />}
          >
            מחשבון חדש
          </TelemButton>
        </>
      }
    >
      <div className="mt-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">פרטי משקיע</TabsTrigger>
            <TabsTrigger value="calculators">מחשבונים</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Investor profile card */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>פרופיל משקיע</CardTitle>
                      <CardDescription>פרטי המשקיע וסטטוס</CardDescription>
                    </div>
                    <StatusBadge status={investor.status} className="text-sm font-medium" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile image and name */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-telem-light flex items-center justify-center text-telem-primary text-3xl font-bold mb-4">
                        {investor.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <h3 className="text-xl font-bold">{investor.name}</h3>
                      <p className="text-gray-500">{investor.username}</p>
                    </div>

                    {/* Contact information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">פרטי התקשרות</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Mail className="ml-2 h-5 w-5 text-gray-400" />
                          <span>{investor.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="ml-2 h-5 w-5 text-gray-400" />
                          <span>{investor.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarDays className="ml-2 h-5 w-5 text-gray-400" />
                          <span>הצטרף בתאריך: {formatDate(investor.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity summary */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">פעילות</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="ml-2 p-1 rounded-md bg-telem-light">
                            <BarChart4 className="h-5 w-5 text-telem-primary" />
                          </div>
                          <div>
                            <span className="block text-gray-900">
                              {calculators?.length || 0} מחשבונים
                            </span>
                            <span className="text-sm text-gray-500">
                              {calculators?.filter(c => c.status === "active").length || 0} פעילים
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="ml-2 p-1 rounded-md bg-telem-light">
                            <Building2 className="h-5 w-5 text-telem-primary" />
                          </div>
                          <div>
                            <span className="block text-gray-900">
                              {/* In a real app, this would come from the API */}
                              5 אפשרויות השקעה
                            </span>
                            <span className="text-sm text-gray-500">
                              2 מועדפות
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card>
                <CardHeader>
                  <CardTitle>פעילות אחרונה</CardTitle>
                  <CardDescription>פעולות אחרונות של המשקיע</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-telem-primary bg-opacity-20 text-telem-primary mr-3">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">צפה במחשבון "חישוב השקעה בפאפוס"</p>
                        <p className="text-xs text-gray-500">לפני שעתיים</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mr-3">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">הוסיף אפשרות השקעה חדשה</p>
                        <p className="text-xs text-gray-500">לפני 3 ימים</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 mr-3">
                        <BarChart4 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">ערך ניתוח משכנתא</p>
                        <p className="text-xs text-gray-500">לפני שבוע</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>הערות</CardTitle>
                  <CardDescription>הערות ומידע נוסף על המשקיע</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm">המשקיע מתעניין בדירות 3 חדרים בלימסול עם נוף לים.</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>יועץ מערכת</span>
                        <span>15.07.2023</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm">המשקיע ביקש לקבל מידע על אפשרויות מימון ממקורות ישראליים.</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>יועץ מערכת</span>
                        <span>03.06.2023</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calculators" className="space-y-4">
            {/* Calculators list */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>מחשבוני השקעה</CardTitle>
                    <CardDescription>
                      רשימת מחשבוני השקעה של {investor.name}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsAddCalculatorOpen(true)}
                    className="bg-telem-primary hover:bg-telem-primary-dark"
                  >
                    <PlusCircle className="ml-2 h-4 w-4" />
                    מחשבון חדש
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCalculators ? (
                  <div className="flex items-center justify-center h-32">
                    <LoaderCircle className="w-8 h-8 animate-spin text-telem-primary" />
                  </div>
                ) : !calculators || calculators.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      אין מחשבונים עדיין
                    </h3>
                    <p className="text-gray-500 mb-4">
                      למשקיע זה אין מחשבוני השקעה. צור מחשבון חדש כדי להתחיל.
                    </p>
                    <Button
                      onClick={() => setIsAddCalculatorOpen(true)}
                      className="bg-telem-primary hover:bg-telem-primary-dark"
                    >
                      <PlusCircle className="ml-2 h-4 w-4" />
                      צור מחשבון חדש
                    </Button>
                  </div>
                ) : (
                  <DataTable
                    columns={calculatorColumns}
                    data={calculators}
                    keyExtractor={(calculator) => calculator.id}
                    initialSortColumn="createdAt"
                    initialSortDirection="desc"
                    searchable={true}
                    searchPlaceholder="חיפוש מחשבונים..."
                    onRowClick={(calculator) => navigate(`/calculators/${calculator.id}`)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>היסטוריית פעילות</CardTitle>
                <CardDescription>כל הפעולות שבוצעו על ידי המשקיע או עבורו</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Today */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      היום
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center border-b border-gray-200 pb-4">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-telem-primary bg-opacity-20 text-telem-primary">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            צפה במחשבון "חישוב השקעה בפאפוס"
                          </p>
                          <p className="text-xs text-gray-500">
                            המשקיע צפה במחשבון
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          10:30
                        </div>
                      </div>
                      <div className="flex items-center border-b border-gray-200 pb-4">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-telem-primary bg-opacity-20 text-telem-primary">
                          <BarChart4 className="h-4 w-4" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            שינה פרמטרים בניתוח משכנתא
                          </p>
                          <p className="text-xs text-gray-500">
                            המשקיע עדכן את תקופת ההלוואה ל-25 שנה
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          09:15
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yesterday */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      אתמול
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center border-b border-gray-200 pb-4">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            הוסיף אפשרות השקעה "דירת 3 חדרים בלימסול"
                          </p>
                          <p className="text-xs text-gray-500">
                            המשקיע הוסיף אפשרות השקעה חדשה למחשבון
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          16:45
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Week */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      שבוע שעבר
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center border-b border-gray-200 pb-4">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            יצר מחשבון "חישוב השקעה בלימסול"
                          </p>
                          <p className="text-xs text-gray-500">
                            יועץ מערכת יצר מחשבון חדש
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          05.07.2023
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                          <BarChart4 className="h-4 w-4" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            ערך ניתוח משכנתא
                          </p>
                          <p className="text-xs text-gray-500">
                            יועץ מערכת ערך ניתוח משכנתא למחשבון "חישוב השקעה בפאפוס"
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          03.07.2023
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Calculator Dialog */}
      <Dialog open={isAddCalculatorOpen} onOpenChange={setIsAddCalculatorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>הוספת מחשבון חדש</DialogTitle>
            <DialogDescription>
              צור מחשבון חדש עבור המשקיע {investor.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...calculatorForm}>
            <form onSubmit={calculatorForm.handleSubmit(onSubmitCalculator)} className="space-y-4">
              <FormField
                control={calculatorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המחשבון</FormLabel>
                    <FormControl>
                      <Input placeholder="שם המחשבון" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={calculatorForm.control}
                name="selfEquity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הון עצמי (בש"ח)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={calculatorForm.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שער חליפין (₪/€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={calculatorForm.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שיעור מע"מ (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    id="hasMortgage"
                    type="checkbox"
                    className="h-4 w-4 text-telem-primary focus:ring-telem-primary border-gray-300 rounded"
                    {...calculatorForm.register("hasMortgage")}
                  />
                  <label htmlFor="hasMortgage" className="text-sm text-gray-700">
                    תכנון עם משכנתא
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    id="hasPropertyInIsrael"
                    type="checkbox"
                    className="h-4 w-4 text-telem-primary focus:ring-telem-primary border-gray-300 rounded"
                    {...calculatorForm.register("hasPropertyInIsrael")}
                  />
                  <label htmlFor="hasPropertyInIsrael" className="text-sm text-gray-700">
                    יש נכס קיים בישראל
                  </label>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddCalculatorOpen(false)}
                >
                  ביטול
                </Button>
                <Button 
                  type="submit"
                  className="bg-telem-primary hover:bg-telem-primary-dark"
                  disabled={createCalculatorMutation.isPending}
                >
                  {createCalculatorMutation.isPending ? "יוצר מחשבון..." : "צור מחשבון"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
