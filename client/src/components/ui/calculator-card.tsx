import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator } from "@shared/schema";
import { useTranslation } from "@/hooks/use-locale";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Copy, Share2, Printer, ArrowRight } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CalculatorDialog } from "../dialogs/calculator-dialog";
import { useState } from "react";

interface CalculatorCardProps {
  calculator: Calculator;
  onDuplicate?: (id: number) => void;
  onShare?: (id: number) => void;
  onPrint?: (id: number) => void;
}

export default function CalculatorCard({ 
  calculator, 
  onDuplicate,
  onShare,
  onPrint
}: CalculatorCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("status.active");
      case "draft":
        return t("status.draft");
      case "archived":
        return t("status.archived");
      default:
        return status;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium">{calculator.name}</h2>
            <p className="text-sm text-muted-foreground">{calculator.investorName}</p>
          </div>
          <Badge variant={getBadgeVariant(calculator.status)} className="mr-auto">
            {getStatusLabel(calculator.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t("calculators.self_equity")}</span>
          <span className="text-sm font-medium">
            {formatCurrency(calculator.selfEquity, "ILS")}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t("calculators.investment_options")}</span>
          <span className="text-sm font-medium">{calculator.investmentOptionsCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t("calculators.analyses")}</span>
          <span className="text-sm font-medium">{calculator.analysesCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t("calculators.updated_at")}</span>
          <span className="text-sm font-medium">
            {formatDate(calculator.updatedAt)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted">
        <div className="flex items-center justify-between w-full">
          <div className="flex space-x-3 space-x-reverse">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:text-primary/80" 
              title={t("button.duplicate")}
              onClick={() => onDuplicate && onDuplicate(calculator.id)}
            >
              <Copy className="h-5 w-5" />
              <span className="sr-only">{t("button.duplicate")}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-secondary hover:text-secondary/80" 
              title={t("button.share")}
              onClick={() => onShare && onShare(calculator.id)}
            >
              <Share2 className="h-5 w-5" />
              <span className="sr-only">{t("button.share")}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-muted-foreground/80" 
              title={t("button.print")}
              onClick={() => onPrint && onPrint(calculator.id)}
            >
              <Printer className="h-5 w-5" />
              <span className="sr-only">{t("button.print")}</span>
            </Button>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="text-primary pr-0">
                <span>{t("button.edit")}</span>
                <ArrowRight className="h-4 w-4 mr-1" />
              </Button>
            </DialogTrigger>
            <CalculatorDialog calculator={calculator} setOpen={setOpen} />
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
