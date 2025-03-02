import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-locale";
import { Calculator } from "@shared/schema";
import CalculatorForm from "@/components/forms/calculator-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dispatch, SetStateAction } from "react";

interface CalculatorDialogProps {
  calculator?: Calculator;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function CalculatorDialog({ calculator, setOpen }: CalculatorDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (values: any) => {
    try {
      if (calculator?.id) {
        // Update
        await apiRequest("PATCH", `/api/calculators/${calculator.id}`, values);
        toast({
          title: "מחשבון עודכן",
          description: "המחשבון עודכן בהצלחה",
        });
      } else {
        // Create
        await apiRequest("POST", "/api/calculators", values);
        toast({
          title: "מחשבון נוצר",
          description: "המחשבון נוצר בהצלחה",
        });
      }
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      setOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת המחשבון",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const title = calculator?.id 
    ? `${calculator.name} - ${calculator.investorName}` 
    : t("calculators.new");

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
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </TabsContent>
          <TabsContent value="investments" className="pt-4 overflow-y-auto max-h-[60vh]">
            <p>תוכן אפשרויות השקעה יוצג כאן</p>
          </TabsContent>
          <TabsContent value="analyses" className="pt-4 overflow-y-auto max-h-[60vh]">
            <p>תוכן ניתוחים יוצג כאן</p>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="pt-4 overflow-y-auto max-h-[70vh]">
          <CalculatorForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}
    </DialogContent>
  );
}
