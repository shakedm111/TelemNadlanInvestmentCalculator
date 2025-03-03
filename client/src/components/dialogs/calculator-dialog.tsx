import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-locale";
import { Calculator, Investment, Property } from "@shared/schema";
import CalculatorForm from "@/components/forms/calculator-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dispatch, SetStateAction, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Check, Edit, Plus, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InvestmentForm, { InvestmentFormValues } from "@/components/forms/investment-form";
import { Badge } from "@/components/ui/badge";

interface CalculatorDialogProps {
  calculator?: Calculator;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function CalculatorDialog({ calculator, setOpen }: CalculatorDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState<Investment | undefined>(undefined);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch investments if calculator exists
  const { data: investments, isLoading: investmentsLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments", calculator?.id],
    queryFn: async () => {
      if (!calculator?.id) return [];
      const response = await fetch(`/api/investments?calculatorId=${calculator.id}`);
      if (!response.ok) throw new Error("Failed to fetch investments");
      return response.json();
    },
    enabled: !!calculator?.id,
  });

  // Fetch properties for investment options
  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: !!calculator?.id,
  });
  
  // Fetch investors for calculator form
  const { data: investors } = useQuery<any[]>({
    queryKey: ["/api/investors"],
  });

  // Create/Update investment mutation
  const investmentMutation = useMutation({
    mutationFn: async (data: InvestmentFormValues & { calculatorId: number }) => {
      if (currentInvestment) {
        return apiRequest("PATCH", `/api/investments/${currentInvestment.id}`, data);
      } else {
        return apiRequest("POST", "/api/investments", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments", calculator?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      toast({
        title: currentInvestment ? "אפשרות השקעה עודכנה" : "אפשרות השקעה נוספה",
        description: currentInvestment ? "אפשרות ההשקעה עודכנה בהצלחה" : "אפשרות ההשקעה נוספה בהצלחה",
      });
      setShowInvestmentForm(false);
      setCurrentInvestment(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete investment mutation
  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments", calculator?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      toast({
        title: "אפשרות השקעה נמחקה",
        description: "אפשרות ההשקעה נמחקה בהצלחה",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה: ${error.message}`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    }
  });

  const handleDeleteInvestment = (id: number) => {
    setDeleteInvestmentId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteInvestment = () => {
    if (deleteInvestmentId) {
      deleteInvestmentMutation.mutate(deleteInvestmentId);
    }
  };

  // Calculator form submission
  const handleCalcSubmit = async (values: any) => {
    try {
      // Make sure investorId is correctly sent as userId and find investor name
      const investor = investors?.find((inv: any) => inv.id.toString() === values.investorId.toString());
      const investorName = investor?.name || 'משקיע';
      
      const payload = {
        name: values.name,
        userId: values.investorId,
        selfEquity: values.selfEquity,
        hasMortgage: values.hasMortgage,
        hasPropertyInIsrael: values.hasPropertyInIsrael,
        investmentPreference: values.investmentPreference,
        exchangeRate: values.exchangeRate,
        vatRate: values.vatRate,
        status: values.status,
        investorName: investorName
      };
      
      if (calculator?.id) {
        // Update
        await apiRequest("PATCH", `/api/calculators/${calculator.id}`, payload);
        toast({
          title: "מחשבון עודכן",
          description: "המחשבון עודכן בהצלחה",
        });
      } else {
        // Create
        await apiRequest("POST", "/api/calculators", payload);
        toast({
          title: "מחשבון נוצר",
          description: "המחשבון נוצר בהצלחה",
        });
      }
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      setOpen(false);
    } catch (error) {
      console.error("Error saving calculator:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת המחשבון",
        variant: "destructive",
      });
    }
  };

  // Investment form submission
  const handleInvestmentSubmit = (values: InvestmentFormValues) => {
    if (calculator?.id) {
      investmentMutation.mutate({
        ...values,
        calculatorId: calculator.id
      });
    }
  };

  const handleAddInvestment = () => {
    setCurrentInvestment(undefined);
    setShowInvestmentForm(true);
  };

  const handleEditInvestment = (investment: Investment) => {
    setCurrentInvestment(investment);
    setShowInvestmentForm(true);
  };

  const handleCancelInvestment = () => {
    setShowInvestmentForm(false);
    setCurrentInvestment(undefined);
  };

  const title = calculator?.id 
    ? `${calculator.name} - ${calculator.investorName}` 
    : t("calculators.new");

  // Render investment card
  const renderInvestmentCard = (investment: Investment) => {
    // Find property details
    const property = properties?.find(p => p.id === investment.propertyId);
    if (!property) return null;

    // Use override values if available, otherwise use property values
    const price = investment.priceOverride !== null ? Number(investment.priceOverride) : Number(property.priceWithoutVAT);
    const rent = investment.monthlyRentOverride !== null ? Number(investment.monthlyRentOverride) : Number(property.monthlyRent);
    
    // Calculate yield (annual rent / price) * 100
    const annualRent = rent * 12;
    const yieldValue = (annualRent / price) * 100;

    return (
      <Card key={investment.id} className={investment.isSelected ? "border-2 border-primary" : ""}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{investment.name}</CardTitle>
              <CardDescription>{property.name}</CardDescription>
            </div>
            {investment.isSelected && (
              <Badge className="bg-primary text-primary-foreground">
                <Check className="h-3 w-3 mr-1" /> נבחר
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditInvestment(investment)}>
                  ערוך אפשרות השקעה
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteInvestment(investment.id)}
                  className="text-red-600"
                >
                  מחק אפשרות השקעה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>מחיר: <span className="font-medium">{formatCurrency(price, "EUR")}</span></div>
            <div>שכ"ד חודשי: <span className="font-medium">{formatCurrency(rent, "EUR")}</span></div>
            <div>תשואה: <span className="font-medium">{yieldValue.toFixed(2)}%</span></div>
            <div>מיקום: <span className="font-medium">{property.location}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {investment.hasFurniture && <Badge variant="outline">ריהוט</Badge>}
            {investment.hasPropertyManagement && <Badge variant="outline">ניהול נכס</Badge>}
            {investment.hasRealEstateAgent && <Badge variant="outline">תיווך</Badge>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {calculator?.id 
            ? "עריכת פרטי המחשבון, אפשרויות השקעה וניתוחים" 
            : "יצירת מחשבון חדש לניתוח השקעה"}
        </DialogDescription>
      </DialogHeader>

      {calculator?.id ? (
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{t("calculators.details")}</TabsTrigger>
            <TabsTrigger value="investments">
              {t("calculators.investment_options")} ({calculator.investmentOptionsCount})
            </TabsTrigger>
            <TabsTrigger value="analyses">
              {t("calculators.analyses")} ({calculator.analysesCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-4 overflow-y-auto max-h-[60vh]">
            <CalculatorForm
              calculator={calculator}
              onSubmit={handleCalcSubmit}
              onCancel={() => setOpen(false)}
            />
          </TabsContent>
          <TabsContent value="investments" className="pt-4 overflow-y-auto max-h-[60vh]">
            {showInvestmentForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>{currentInvestment ? "עריכת אפשרות השקעה" : "הוספת אפשרות השקעה"}</CardTitle>
                  <CardDescription>
                    {currentInvestment 
                      ? "עדכון פרטי אפשרות ההשקעה" 
                      : "בחר נכס והגדר את פרטי אפשרות ההשקעה"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertiesLoading ? (
                    <div className="text-center py-4">טוען נכסים...</div>
                  ) : (properties && properties.length > 0) ? (
                    <InvestmentForm
                      calculatorId={calculator.id}
                      investment={currentInvestment}
                      properties={properties}
                      onSubmit={handleInvestmentSubmit}
                      onCancel={handleCancelInvestment}
                      isLoading={investmentMutation.isPending}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="mb-4">אין נכסים במערכת. יש להוסיף נכסים כדי ליצור אפשרויות השקעה.</p>
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        לך לדף הנכסים
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">אפשרויות השקעה</h3>
                  <Button size="sm" onClick={handleAddInvestment}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף אפשרות השקעה
                  </Button>
                </div>
                
                {investmentsLoading ? (
                  <div className="text-center py-10">טוען אפשרויות השקעה...</div>
                ) : investments && investments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {investments.map(investment => renderInvestmentCard(investment))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-3">אין אפשרויות השקעה עדיין</p>
                    <Button size="sm" onClick={handleAddInvestment}>
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף אפשרות השקעה ראשונה
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="analyses" className="pt-4 overflow-y-auto max-h-[60vh]">
            <div className="text-center py-10 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">ניתוחים יהיו זמינים בקרוב</p>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="pt-4 overflow-y-auto max-h-[70vh]">
          <CalculatorForm
            onSubmit={handleCalcSubmit}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}

      {/* Delete Investment Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את אפשרות ההשקעה.
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse">
            <AlertDialogAction 
              onClick={confirmDeleteInvestment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );
}
